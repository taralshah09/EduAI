/**
 * World404.jsx
 *
 * An infinite procedurally-generated 404 page built with React Three Fiber.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  CONTROLS                                                   │
 * │  W              ──  Move FORWARD                            │
 * │  S              ──  Move BACKWARD                           │
 * │  A              ──  Move LEFT  (strafe)                     │
 * │  D              ──  Move RIGHT (strafe)                     │
 * │  ↑ Arrow Up     ──  Rotate camera UP   (look up)            │
 * │  ↓ Arrow Down   ──  Rotate camera DOWN (look down)          │
 * │  ← Arrow Left   ──  Rotate camera LEFT (turn left)          │
 * │  → Arrow Right  ──  Rotate camera RIGHT(turn right)         │
 * │  Click portal   ──  Navigate to "/"                         │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Systems overview:
 *   ┌─ Noise       : 2D value noise + FBM for organic terrain height
 *   ├─ Chunks      : Square terrain tiles loaded/unloaded around the player
 *   ├─ Objects     : Deterministic pillars & cubes per chunk (seeded RNG)
 *   ├─ Player      : WASD moves relative to camera yaw direction
 *   ├─ Camera      : Arrow keys orbit camera (yaw + pitch); lerped follow
 *   ├─ Signs       : Floating Text meshes at landmark positions
 *   ├─ Portal      : Spinning torus gateway back to "/"
 *   └─ UI          : HTML overlay (title + controls + coordinates)
 */

import React, {
    useRef, useState, useEffect, useCallback, useMemo,
    Suspense, memo,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, Stars } from '@react-three/drei'
import * as THREE from 'three'


// ─────────────────────────────────────────────────────────────
// WORLD CONSTANTS
// ─────────────────────────────────────────────────────────────

const CHUNK_SIZE = 48     // World-units per chunk side
const SEGMENTS = 20     // Vertex subdivisions per chunk side
const RENDER_DIST = 3      // Chunks to load in each direction (7×7 grid)
const HEIGHT_SCALE = 5.5    // Maximum terrain elevation
const NOISE_FREQ = 0.032  // Noise frequency (lower = broader hills)
const PLAYER_SPEED = 15     // Units per second  (WASD movement)
const YAW_SPEED = 1.75   // Radians per second (Arrow Left / Right)
const PITCH_SPEED = 1.25   // Radians per second (Arrow Up   / Down)

/**
 * How far above/below DEFAULT_PITCH the player can tilt the camera.
 * Negative = looking upward; Positive = looking downward.
 */
const PITCH_MIN_OFFSET = -0.55
const PITCH_MAX_OFFSET = 0.65

const CAM_ORBIT_R = 17     // Camera-to-player orbital radius
const CAM_LERP = 0.08   // Camera smoothing (0 = frozen, 1 = instant)

/**
 * DEFAULT_PITCH: resting downward angle so the camera naturally gazes at
 * the terrain ahead of the player. ≈ atan2(9, 14) = 0.57 rad.
 */
const DEFAULT_PITCH = 0.57

const SKY_COLOR = '#050510'


// ─────────────────────────────────────────────────────────────
// VALUE NOISE  (no external dependency — fully self-contained)
// ─────────────────────────────────────────────────────────────

/** Deterministic float hash for two integers → [0, 1] */
function hash(ix, iy) {
    const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123
    return n - Math.floor(n)
}

/** Smoothstep for C¹-continuous interpolation */
function smooth(t) { return t * t * (3 - 2 * t) }

/** Bilinear-interpolated value noise at (x, y) → [0, 1] */
function noise2d(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y)
    const fx = x - ix, fy = y - iy
    const ux = smooth(fx), uy = smooth(fy)
    const ll = hash(ix, iy)
    const lr = hash(ix + 1, iy)
    const ul = hash(ix, iy + 1)
    const ur = hash(ix + 1, iy + 1)
    return ll + (lr - ll) * ux + (ul - ll) * uy + (ll - lr - ul + ur) * ux * uy
}

/**
 * Fractal Brownian Motion — sums noise at increasing frequencies.
 * Produces the layered, organic look of natural terrain.
 */
function fbm(x, y, octaves = 5) {
    let val = 0, amp = 0.5, freq = 1, total = 0
    for (let i = 0; i < octaves; i++) {
        val += noise2d(x * freq, y * freq) * amp
        total += amp
        amp *= 0.5
        freq *= 2.0
    }
    return val / total
}

/** Terrain height at world-space (wx, wz) */
function getTerrainHeight(wx, wz) {
    return fbm(wx * NOISE_FREQ, wz * NOISE_FREQ) * HEIGHT_SCALE
}


// ─────────────────────────────────────────────────────────────
// SEEDED PSEUDO-RANDOM NUMBER GENERATOR
// One RNG per chunk (seeded by cx & cz) ensures object placement
// is identical every time a chunk is loaded/unloaded.
// ─────────────────────────────────────────────────────────────

function seededRng(seed) {
    let s = seed | 0
    return () => {
        s = (s * 9301 + 49297) % 233280
        return s / 233280
    }
}


// ─────────────────────────────────────────────────────────────
// TERRAIN GEOMETRY BUILDER
// Constructs a BufferGeometry for one chunk:
//   • (SEGMENTS+1)² vertices displaced by noise along Y
//   • Height-based vertex colours (deep navy valleys → teal peaks)
//   • SEGMENTS² quads stitched as triangle pairs
// ─────────────────────────────────────────────────────────────

function buildChunkGeometry(cx, cz) {
    const positions = []
    const colors = []
    const indices = []

    const step = CHUNK_SIZE / SEGMENTS
    const ox = cx * CHUNK_SIZE   // chunk world-origin X
    const oz = cz * CHUNK_SIZE   // chunk world-origin Z

    for (let iz = 0; iz <= SEGMENTS; iz++) {
        for (let ix = 0; ix <= SEGMENTS; ix++) {
            const wx = ox + ix * step
            const wz = oz + iz * step
            const wy = getTerrainHeight(wx, wz)
            positions.push(wx, wy, wz)

            // Height-based colour gradient
            const t = wy / HEIGHT_SCALE
            colors.push(
                0.01 + t * 0.05,   // R
                0.04 + t * 0.22,   // G
                0.12 + t * 0.40,   // B
            )
        }
    }

    // Two triangles per quad
    for (let iz = 0; iz < SEGMENTS; iz++) {
        for (let ix = 0; ix < SEGMENTS; ix++) {
            const a = iz * (SEGMENTS + 1) + ix
            const b = a + 1
            const c = a + (SEGMENTS + 1)
            const d = c + 1
            indices.push(a, c, b, b, c, d)
        }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
}


// ─────────────────────────────────────────────────────────────
// TERRAIN CHUNK
// Memoized so geometry is only rebuilt when (cx, cz) change.
// GPU geometry is disposed on unmount to prevent memory leaks.
// ─────────────────────────────────────────────────────────────

const TerrainChunk = memo(function TerrainChunk({ cx, cz }) {
    const geo = useMemo(() => buildChunkGeometry(cx, cz), [cx, cz])
    useEffect(() => () => geo.dispose(), [geo])

    return (
        <mesh geometry={geo} receiveShadow>
            <meshStandardMaterial vertexColors roughness={0.88} metalness={0.12} />
        </mesh>
    )
})


// ─────────────────────────────────────────────────────────────
// CHUNK OBJECTS
// Deterministically scatter pillars and cubes across a chunk.
// Seeded RNG → identical layout on every load.
// ─────────────────────────────────────────────────────────────

const ChunkObjects = memo(function ChunkObjects({ cx, cz }) {
    const objects = useMemo(() => {
        const rng = seededRng(cx * 10007 + cz * 31337)
        const count = Math.floor(rng() * 5) + 2
        const items = []

        for (let i = 0; i < count; i++) {
            const lx = (rng() - 0.5) * CHUNK_SIZE * 0.82
            const lz = (rng() - 0.5) * CHUNK_SIZE * 0.82
            const wx = cx * CHUNK_SIZE + lx
            const wz = cz * CHUNK_SIZE + lz
            const wy = getTerrainHeight(wx, wz)
            const isPillar = rng() > 0.35
            const scale = 0.35 + rng() * 0.9
            items.push({ wx, wy, wz, isPillar, scale, key: i })
        }
        return items
    }, [cx, cz])

    return (
        <group>
            {objects.map(o => {
                const posY = o.wy + (o.isPillar ? o.scale * 3 : o.scale * 0.7)
                return (
                    <mesh key={o.key} position={[o.wx, posY, o.wz]} castShadow>
                        {o.isPillar
                            ? <cylinderGeometry args={[o.scale * 0.22, o.scale * 0.32, o.scale * 6, 6]} />
                            : <boxGeometry args={[o.scale * 1.3, o.scale * 1.3, o.scale * 1.3]} />
                        }
                        <meshStandardMaterial
                            color="#030412"
                            emissive={o.isPillar ? '#0a2055' : '#07153a'}
                            emissiveIntensity={0.7}
                            metalness={0.92}
                            roughness={0.12}
                        />
                    </mesh>
                )
            })}
        </group>
    )
})


// ─────────────────────────────────────────────────────────────
// FLOATING SIGN — bobbing Text mesh landmark
// ─────────────────────────────────────────────────────────────

function FloatingSign({ position, text, fontSize = 2, color = '#00ffee', speed = 0.65 }) {
    const ref = useRef()
    const baseY = position[1]

    useFrame(({ clock }) => {
        if (!ref.current) return
        const t = clock.elapsedTime
        ref.current.position.y = baseY + Math.sin(t * speed) * 0.65
        ref.current.rotation.y = Math.sin(t * 0.12) * 0.25
    })

    return (
        <Text
            ref={ref}
            position={position}
            fontSize={fontSize}
            color={color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000020"
            depthOffset={-1}
        >
            {text}
        </Text>
    )
}


// ─────────────────────────────────────────────────────────────
// PORTAL — spinning torus gateway back to "/"
// ─────────────────────────────────────────────────────────────

function Portal() {
    const outerRef = useRef()
    const innerRef = useRef()
    const glowRef = useRef()

    const pX = 28, pZ = -40
    const pY = getTerrainHeight(pX, pZ) + 5.5

    useFrame(({ clock }) => {
        const t = clock.elapsedTime
        if (outerRef.current) outerRef.current.rotation.z = t * 0.55
        if (innerRef.current) innerRef.current.rotation.z = -t * 0.85
        if (glowRef.current) glowRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.08)
    })

    return (
        <group position={[pX, pY, pZ]} onClick={() => { window.location.href = '/' }}>
            <mesh ref={outerRef}>
                <torusGeometry args={[3.6, 0.18, 16, 80]} />
                <meshStandardMaterial color="#ff00cc" emissive="#ff00cc" emissiveIntensity={2.5} toneMapped={false} />
            </mesh>
            <mesh ref={innerRef}>
                <torusGeometry args={[2.85, 0.09, 8, 64]} />
                <meshStandardMaterial color="#ffffff" emissive="#bb44ff" emissiveIntensity={3} toneMapped={false} />
            </mesh>
            <mesh>
                <circleGeometry args={[2.8, 48]} />
                <meshStandardMaterial
                    color="#18003a" emissive="#6600cc" emissiveIntensity={1.4}
                    transparent opacity={0.78} side={THREE.DoubleSide} toneMapped={false}
                />
            </mesh>
            <mesh ref={glowRef}>
                <sphereGeometry args={[3.3, 10, 7]} />
                <meshStandardMaterial color="#ff00cc" transparent opacity={0.04} side={THREE.BackSide} toneMapped={false} />
            </mesh>
            <Text position={[0, -5.2, 0]} fontSize={0.65} color="#ffccff"
                anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#220044">
                ↩ Return Home
            </Text>
            <pointLight color="#ff00cc" intensity={10} distance={22} decay={2} />
        </group>
    )
}


// ─────────────────────────────────────────────────────────────
// PLAYER CONTROLLER
//
// Strict key mapping — WASD and Arrow Keys do completely
// different things and never conflict.
//
// ── WASD (movement) ──────────────────────────────────────────
//   Movement is always relative to the current camera yaw so
//   W always pushes you toward where you are *looking* on the
//   horizontal plane (pitch does NOT affect movement direction).
//
//   Forward vector  = ( sin(yaw),  0,  cos(yaw) )
//   Right vector    = ( cos(yaw),  0, -sin(yaw) )   ← 90° CW
//
//   W → +forward    (move toward camera facing direction)
//   S → -forward    (move away)
//   A → -right      (strafe left)
//   D → +right      (strafe right)
//
// ── Arrow Keys (POV rotation) ────────────────────────────────
//   ← ArrowLeft  → yaw decreases → camera swings left  → world turns right
//   → ArrowRight → yaw increases → camera swings right → world turns left
//   ↑ ArrowUp    → pitchOffset decreases → camera tilts up   → horizon rises
//   ↓ ArrowDown  → pitchOffset increases → camera tilts down → horizon drops
// ─────────────────────────────────────────────────────────────

function PlayerController({ playerRef, onChunkChange }) {
    const keys = useRef({})

    useEffect(() => {
        const onDown = e => {
            // Stop browser from scrolling the page when Arrow Keys are held
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault()
            }
            keys.current[e.key] = true
        }
        const onUp = e => { keys.current[e.key] = false }

        window.addEventListener('keydown', onDown)
        window.addEventListener('keyup', onUp, { passive: true })
        return () => {
            window.removeEventListener('keydown', onDown)
            window.removeEventListener('keyup', onUp)
        }
    }, [])

    useFrame((_, delta) => {
        const k = keys.current
        // Cap delta — prevents a huge position jump if the tab was backgrounded
        const dt = Math.min(delta, 0.05)

        // ── Arrow Keys → rotate the camera POV ───────────────────────
        if (k['ArrowLeft']) playerRef.current.yaw -= YAW_SPEED * dt
        if (k['ArrowRight']) playerRef.current.yaw += YAW_SPEED * dt
        if (k['ArrowUp']) playerRef.current.pitchOffset =
            Math.max(PITCH_MIN_OFFSET, playerRef.current.pitchOffset - PITCH_SPEED * dt)
        if (k['ArrowDown']) playerRef.current.pitchOffset =
            Math.min(PITCH_MAX_OFFSET, playerRef.current.pitchOffset + PITCH_SPEED * dt)

        // ── WASD → move on the horizontal terrain plane ───────────────
        // Forward and right vectors derived from yaw only (not pitch),
        // so the player always walks flat regardless of look angle.
        const yaw = playerRef.current.yaw
        const fwdX = Math.sin(yaw)      // forward X component
        const fwdZ = Math.cos(yaw)      // forward Z component
        const rightX = Math.cos(yaw)      // right X component
        const rightZ = -Math.sin(yaw)      // right Z component
        const spd = PLAYER_SPEED * dt

        let dx = 0, dz = 0
        if (k['w'] || k['W']) { dx += fwdX * spd; dz += fwdZ * spd } // forward
        if (k['s'] || k['S']) { dx -= fwdX * spd; dz -= fwdZ * spd } // backward
        if (k['a'] || k['A']) { dx -= rightX * spd; dz -= rightZ * spd } // strafe left
        if (k['d'] || k['D']) { dx += rightX * spd; dz += rightZ * spd } // strafe right

        if (dx !== 0 || dz !== 0) {
            playerRef.current.x += dx
            playerRef.current.z += dz
            // Keep the player snapped to the terrain surface
            playerRef.current.y = getTerrainHeight(playerRef.current.x, playerRef.current.z)
            // Notify the chunk system to load/unload tiles as needed
            onChunkChange(playerRef.current.x, playerRef.current.z)
        }
    })

    return null
}


// ─────────────────────────────────────────────────────────────
// CAMERA RIG
//
// Third-person orbital camera. The camera always sits on a
// sphere of radius CAM_ORBIT_R centred on the player.
//
// Its angular position on that sphere is:
//   horizontal angle  = yaw          (changed by ← → Arrow Keys)
//   vertical angle    = totalPitch   (DEFAULT_PITCH + pitchOffset)
//
// Sphere → Cartesian (camera behind the player):
//   hDist  = cos(totalPitch) × CAM_ORBIT_R   — horizontal offset
//   vDist  = sin(totalPitch) × CAM_ORBIT_R   — vertical offset
//
//   camX   = playerX − sin(yaw) × hDist    (behind on X axis)
//   camZ   = playerZ − cos(yaw) × hDist    (behind on Z axis)
//   camY   = playerY + vDist
//
// camPos and lookAt are lerped each frame for smooth, lag-free
// following that feels good even on uneven terrain.
// ─────────────────────────────────────────────────────────────

function CameraRig({ playerRef }) {
    const { camera } = useThree()
    const camPos = useRef(new THREE.Vector3())
    const lookAtTarget = useRef(new THREE.Vector3())
    const isFirstFrame = useRef(true)

    useFrame(() => {
        const { x, y, z, yaw, pitchOffset } = playerRef.current

        // Combine resting angle with the player's Arrow Key input
        const totalPitch = DEFAULT_PITCH + pitchOffset

        // Split the orbital radius into horizontal and vertical components
        const hDist = Math.cos(totalPitch) * CAM_ORBIT_R
        const vDist = Math.sin(totalPitch) * CAM_ORBIT_R

        // Camera target position: behind the player along the yaw axis
        const targetCamPos = new THREE.Vector3(
            x - Math.sin(yaw) * hDist,   // behind on X
            y + vDist,                    // elevated
            z - Math.cos(yaw) * hDist,   // behind on Z
        )

        // Look-at slightly above player feet for a natural gaze
        const targetLookAt = new THREE.Vector3(x, y + 1.6, z)

        if (isFirstFrame.current) {
            // Hard-snap on first frame — prevents a sweeping camera entrance
            camPos.current.copy(targetCamPos)
            lookAtTarget.current.copy(targetLookAt)
            isFirstFrame.current = false
        } else {
            camPos.current.lerp(targetCamPos, CAM_LERP)
            lookAtTarget.current.lerp(targetLookAt, CAM_LERP)
        }

        camera.position.copy(camPos.current)
        camera.lookAt(lookAtTarget.current)
    })

    return null
}


// ─────────────────────────────────────────────────────────────
// CHUNK SYSTEM HOOK
// Maintains the list of active terrain tiles centred on the player.
// State is only updated when the player crosses a chunk boundary,
// keeping React re-renders rare and cheap.
// ─────────────────────────────────────────────────────────────

function useChunkSystem() {
    function buildChunkList(pcx, pcz) {
        const list = []
        for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) {
            for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
                const cx = pcx + dx, cz = pcz + dz
                list.push({ cx, cz, key: `${cx},${cz}` })
            }
        }
        return list
    }

    const [chunks, setChunks] = useState(() => buildChunkList(0, 0))
    const lastCX = useRef(0)
    const lastCZ = useRef(0)

    const update = useCallback((px, pz) => {
        const pcx = Math.floor(px / CHUNK_SIZE)
        const pcz = Math.floor(pz / CHUNK_SIZE)
        if (pcx === lastCX.current && pcz === lastCZ.current) return
        lastCX.current = pcx
        lastCZ.current = pcz
        setChunks(buildChunkList(pcx, pcz))
    }, [])

    return [chunks, update]
}


// ─────────────────────────────────────────────────────────────
// COORD TRACKER — samples player position for the HTML overlay
// ─────────────────────────────────────────────────────────────

function CoordTracker({ playerRef, onUpdate }) {
    useFrame(() => { onUpdate(playerRef.current.x, playerRef.current.z) })
    return null
}


// ─────────────────────────────────────────────────────────────
// SCENE — assembles the complete 3-D world
// ─────────────────────────────────────────────────────────────

function Scene({ onCoordsUpdate }) {
    /**
     * Player state ref — mutations happen in useFrame, never trigger renders.
     *   x, y, z       — world-space position (y is terrain-snapped)
     *   yaw           — horizontal view angle (Arrow ← / →)
     *   pitchOffset   — vertical tilt delta from DEFAULT_PITCH (Arrow ↑ / ↓)
     */
    const playerRef = useRef({ x: 0, y: 0, z: 0, yaw: 0, pitchOffset: 0 })
    const [chunks, updateChunks] = useChunkSystem()

    return (
        <>
            {/* ── Lighting ─────────────────────────────────────────── */}
            <ambientLight color="#0d1533" intensity={1.8} />
            <directionalLight position={[60, 100, 50]} intensity={0.5} color="#3355bb" />
            <pointLight position={[0, 50, 0]} color="#0033bb" intensity={4} distance={150} decay={1.5} />

            {/* ── Fog blends distant terrain into the sky ──────────── */}
            <fog attach="fog" args={[SKY_COLOR, 60, 170]} />

            {/* ── Starfield ────────────────────────────────────────── */}
            <Stars radius={130} depth={40} count={3500} factor={3.5} fade speed={0.4} />

            {/* ── Procedural terrain (chunk-loaded) ────────────────── */}
            {chunks.map(c => <TerrainChunk key={`t-${c.key}`} cx={c.cx} cz={c.cz} />)}

            {/* ── Decorative pillars & cubes per chunk ─────────────── */}
            {chunks.map(c => <ChunkObjects key={`o-${c.key}`} cx={c.cx} cz={c.cz} />)}

            {/* ── Floating 404 signs across the world ──────────────── */}
            <Suspense fallback={null}>
                <FloatingSign position={[0, 16, -18]} text="404" fontSize={11} color="#00ffee" speed={0.55} />
                <FloatingSign position={[38, 12, 50]} text="Page Not Found" fontSize={2.8} color="#ff44aa" speed={0.90} />
                <FloatingSign position={[-50, 10, 40]} text="Keep exploring…" fontSize={2.2} color="#aaaaff" speed={0.50} />
                <FloatingSign position={[75, 12, -50]} text="You are lost" fontSize={2.4} color="#ffaa22" speed={0.72} />
                <FloatingSign position={[-80, 10, -80]} text="404" fontSize={7} color="#5533ff" speed={0.38} />
                <FloatingSign position={[0, 9, 90]} text="∞" fontSize={6} color="#00eeff" speed={1.10} />
                <FloatingSign position={[-30, 11, -80]} text="null://world" fontSize={1.8} color="#ff6688" speed={0.62} />
                <FloatingSign position={[100, 14, 20]} text="LOST" fontSize={4} color="#446688" speed={0.44} />
            </Suspense>

            {/* ── Portal gateway ───────────────────────────────────── */}
            <Suspense fallback={null}>
                <Portal />
            </Suspense>

            {/* ── Player logic (no visible geometry) ───────────────── */}
            <PlayerController playerRef={playerRef} onChunkChange={updateChunks} />

            {/* ── Camera logic (no visible geometry) ───────────────── */}
            <CameraRig playerRef={playerRef} />

            {/* ── Coordinate reporter for the HTML overlay ─────────── */}
            <CoordTracker playerRef={playerRef} onUpdate={onCoordsUpdate} />
        </>
    )
}


// ─────────────────────────────────────────────────────────────
// WORLD 404 — main export
// ─────────────────────────────────────────────────────────────

export default function World404() {
    const [coords, setCoords] = useState({ x: 0, z: 0 })

    // Throttle HTML re-renders: only update when player moves > 6 units
    const handleCoordsUpdate = useCallback((x, z) => {
        setCoords(prev => {
            if (Math.abs(prev.x - x) > 6 || Math.abs(prev.z - z) > 6)
                return { x: Math.round(x), z: Math.round(z) }
            return prev
        })
    }, [])

    return (
        <div style={styles.root}>

            {/* Radial vignette for depth */}
            <div style={styles.vignette} />

            {/* Top banner */}
            <div style={styles.topOverlay}>
                <span style={styles.titleText}>404 — You are lost in the void</span>
            </div>

            {/* Control legend */}
            <div style={styles.bottomOverlay}>
                <span style={styles.hintText}>
                    W A S D — Move &nbsp;·&nbsp; ↑ ↓ ← → — Look around &nbsp;·&nbsp; Click portal to go home
                </span>
            </div>

            {/* Live coordinate readout */}
            <div style={styles.coordsOverlay}>
                <span style={styles.coordsText}>
                    x {String(coords.x).padStart(5, '\u00A0')} · z {String(coords.z).padStart(5, '\u00A0')}
                </span>
            </div>

            {/* Three.js canvas */}
            <Canvas
                style={styles.canvas}
                camera={{ fov: 60, near: 0.1, far: 260 }}
                gl={{ antialias: true, alpha: false }}
                onCreated={({ gl, scene }) => {
                    gl.setClearColor(new THREE.Color(SKY_COLOR))
                    scene.background = new THREE.Color(SKY_COLOR)
                    gl.toneMapping = THREE.ACESFilmicToneMapping
                    gl.toneMappingExposure = 1.1
                }}
            >
                <Scene onCoordsUpdate={handleCoordsUpdate} />
            </Canvas>
        </div>
    )
}


// ─────────────────────────────────────────────────────────────
// INLINE STYLES — component is fully self-contained
// ─────────────────────────────────────────────────────────────

const styles = {
    root: {
        width: '100vw', height: '100vh',
        background: SKY_COLOR,
        position: 'relative', overflow: 'hidden',
        fontFamily: '"Space Mono", "Courier New", monospace',
        userSelect: 'none',
    },
    vignette: {
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, #000000cc 100%)',
    },
    topOverlay: {
        position: 'absolute', top: 28, left: 0, right: 0,
        textAlign: 'center', zIndex: 10, pointerEvents: 'none',
    },
    titleText: {
        color: '#00ffee', fontSize: '0.82rem',
        letterSpacing: '0.38em', textTransform: 'uppercase',
        textShadow: '0 0 10px #00ffee, 0 0 28px #00ffee55',
    },
    bottomOverlay: {
        position: 'absolute', bottom: 28, left: 0, right: 0,
        textAlign: 'center', zIndex: 10, pointerEvents: 'none',
    },
    hintText: {
        color: '#2a3f55', fontSize: '0.62rem',
        letterSpacing: '0.22em', textTransform: 'uppercase',
    },
    coordsOverlay: {
        position: 'absolute', bottom: 28, right: 28,
        zIndex: 10, pointerEvents: 'none',
    },
    coordsText: {
        color: '#1a2d40', fontSize: '0.58rem',
        letterSpacing: '0.12em', fontFamily: 'monospace',
    },
    canvas: {
        position: 'absolute', inset: 0,
    },
}