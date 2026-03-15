/**
 * World404.jsx
 *
 * An infinite procedurally-generated 404 page built with React Three Fiber.
 * Navigate an endless void world — terrain, pillars, floating signs, and a
 * glowing portal that leads you home.
 *
 * Controls : WASD or Arrow Keys
 * Portal   : Click to navigate to "/"
 *
 * Systems overview:
 *   ┌─ Noise       : 2D value noise + FBM for organic terrain height
 *   ├─ Chunks      : Square terrain tiles loaded/unloaded around the player
 *   ├─ Objects     : Deterministic pillars & cubes per chunk (seeded RNG)
 *   ├─ Player      : Keyboard input → smooth delta-time movement
 *   ├─ Camera      : Lerped third-person follow cam
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

const CHUNK_SIZE = 48    // World-units per chunk side
const SEGMENTS = 20    // Vertex subdivisions per chunk side
const RENDER_DIST = 3     // Chunks to load in each direction (7×7 grid)
const HEIGHT_SCALE = 5.5   // Maximum terrain elevation
const NOISE_FREQ = 0.032 // Noise sampling frequency (lower = broader hills)
const PLAYER_SPEED = 15    // Units per second
const YAW_SPEED = 1.8   // Radians per second (left/right arrow rotation)
const CAM_HEIGHT = 9     // Camera height above player
const CAM_DIST = 14    // Camera distance behind player
const CAM_LERP = 0.07  // Camera smoothing (0 = frozen, 1 = instant)
const SKY_COLOR = '#050510'


// ─────────────────────────────────────────────────────────────
// VALUE NOISE  (deterministic, no external dependency)
// ─────────────────────────────────────────────────────────────

/** Deterministic float hash for two integers → [0, 1] */
function hash(ix, iy) {
    const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123
    return n - Math.floor(n)
}

/** Smoothstep curve for C1-continuous interpolation */
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
    // Bilinear blend
    return ll + (lr - ll) * ux + (ul - ll) * uy + (ll - lr - ul + ur) * ux * uy
}

/**
 * Fractal Brownian Motion — layers of noise at increasing frequencies.
 * Produces organic, natural-looking terrain.
 * @returns {number} value in [0, 1]
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

/** World-space terrain height at (wx, wz) */
function getTerrainHeight(wx, wz) {
    return fbm(wx * NOISE_FREQ, wz * NOISE_FREQ) * HEIGHT_SCALE
}


// ─────────────────────────────────────────────────────────────
// SEEDED PSEUDO-RANDOM GENERATOR
// Produces consistent object placement for a given chunk key,
// so chunks look identical every time they are loaded.
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
// Creates a BufferGeometry for one chunk with:
//   - Noise-displaced Y positions
//   - Height-based vertex colours (deep navy → teal)
// ─────────────────────────────────────────────────────────────

function buildChunkGeometry(cx, cz) {
    const positions = []
    const colors = []
    const indices = []

    const step = CHUNK_SIZE / SEGMENTS
    const ox = cx * CHUNK_SIZE   // chunk world origin X
    const oz = cz * CHUNK_SIZE   // chunk world origin Z

    // Build (SEGMENTS+1)² vertices
    for (let iz = 0; iz <= SEGMENTS; iz++) {
        for (let ix = 0; ix <= SEGMENTS; ix++) {
            const wx = ox + ix * step
            const wz = oz + iz * step
            const wy = getTerrainHeight(wx, wz)
            positions.push(wx, wy, wz)

            // Height-based colour: dark navy (valleys) → deep teal (peaks)
            const t = wy / HEIGHT_SCALE // 0 = low, 1 = high
            colors.push(
                0.01 + t * 0.05,   // R
                0.04 + t * 0.22,   // G
                0.12 + t * 0.40,   // B
            )
        }
    }

    // Stitch SEGMENTS² quads into triangles (2 per quad)
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
// Renders one procedural terrain patch.
// Memoized so it only rebuilds geometry when (cx, cz) change.
// ─────────────────────────────────────────────────────────────

const TerrainChunk = memo(function TerrainChunk({ cx, cz }) {
    const geo = useMemo(() => buildChunkGeometry(cx, cz), [cx, cz])

    // Dispose GPU geometry when chunk unmounts (out of render distance)
    useEffect(() => () => geo.dispose(), [geo])

    return (
        <mesh geometry={geo} receiveShadow>
            <meshStandardMaterial
                vertexColors
                roughness={0.88}
                metalness={0.12}
            />
        </mesh>
    )
})


// ─────────────────────────────────────────────────────────────
// CHUNK OBJECTS
// Deterministically scatter pillars and cubes across a chunk.
// Using seeded RNG ensures identical layout on every load.
// ─────────────────────────────────────────────────────────────

const ChunkObjects = memo(function ChunkObjects({ cx, cz }) {
    const objects = useMemo(() => {
        const rng = seededRng(cx * 10007 + cz * 31337)
        const count = Math.floor(rng() * 5) + 2
        const items = []

        for (let i = 0; i < count; i++) {
            // Random local offset within the chunk boundary
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
                // Pillar sits on terrain; cube is half-buried
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
// FLOATING SIGN
// An animated Text mesh that bobs and gently oscillates.
// Wraps drei's <Text> with useFrame animation.
// ─────────────────────────────────────────────────────────────

function FloatingSign({ position, text, fontSize = 2, color = '#00ffee', speed = 0.65 }) {
    const ref = useRef()
    const baseY = position[1]

    useFrame(({ clock }) => {
        if (!ref.current) return
        const t = clock.elapsedTime
        // Gentle vertical bob + slow azimuthal sway
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
// PORTAL
// A spinning torus-ring gateway that navigates to "/" on click.
// Emits a coloured point light for local atmosphere.
// ─────────────────────────────────────────────────────────────

function Portal() {
    const outerRef = useRef()
    const innerRef = useRef()
    const glowRef = useRef()

    // Portal is placed at a fixed world location
    const pX = 28, pZ = -40
    const pY = getTerrainHeight(pX, pZ) + 5.5

    useFrame(({ clock }) => {
        const t = clock.elapsedTime
        if (outerRef.current) outerRef.current.rotation.z = t * 0.55
        if (innerRef.current) innerRef.current.rotation.z = -t * 0.85
        if (glowRef.current) {
            // Breathe the glow sphere
            const s = 1 + Math.sin(t * 1.5) * 0.08
            glowRef.current.scale.setScalar(s)
        }
    })

    return (
        <group
            position={[pX, pY, pZ]}
            onClick={() => { window.location.href = '/' }}
        >
            {/* Outer ring */}
            <mesh ref={outerRef}>
                <torusGeometry args={[3.6, 0.18, 16, 80]} />
                <meshStandardMaterial
                    color="#ff00cc"
                    emissive="#ff00cc"
                    emissiveIntensity={2.5}
                    toneMapped={false}
                />
            </mesh>

            {/* Inner ring */}
            <mesh ref={innerRef}>
                <torusGeometry args={[2.85, 0.09, 8, 64]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#bb44ff"
                    emissiveIntensity={3}
                    toneMapped={false}
                />
            </mesh>

            {/* Filled portal surface */}
            <mesh rotation={[0, 0, 0]}>
                <circleGeometry args={[2.8, 48]} />
                <meshStandardMaterial
                    color="#18003a"
                    emissive="#6600cc"
                    emissiveIntensity={1.4}
                    transparent
                    opacity={0.78}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* Breathing glow shell */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[3.3, 10, 7]} />
                <meshStandardMaterial
                    color="#ff00cc"
                    transparent
                    opacity={0.04}
                    side={THREE.BackSide}
                    toneMapped={false}
                />
            </mesh>

            {/* Return-home label */}
            <Text
                position={[0, -5.2, 0]}
                fontSize={0.65}
                color="#ffccff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.04}
                outlineColor="#220044"
            >
                ↩ Return Home
            </Text>

            {/* Coloured point light radiates portal glow into scene */}
            <pointLight color="#ff00cc" intensity={10} distance={22} decay={2} />
        </group>
    )
}


// ─────────────────────────────────────────────────────────────
// PLAYER CONTROLLER
// Reads keyboard state each frame and moves/rotates playerRef.
// Uses delta-time so speed is frame-rate independent.
//
// Key mapping:
//   W / ↑           — move forward  (along current facing direction)
//   S / ↓           — move backward
//   A               — strafe left   (perpendicular to facing)
//   D               — strafe right
//   ← ArrowLeft     — rotate view left  (yaw -)
//   → ArrowRight    — rotate view right (yaw +)
//
// Returns null — purely logic, no geometry.
// ─────────────────────────────────────────────────────────────

function PlayerController({ playerRef, onChunkChange }) {
    // Track which keys are currently held
    const keys = useRef({})

    useEffect(() => {
        const down = e => { keys.current[e.key] = true }
        const up = e => { keys.current[e.key] = false }
        window.addEventListener('keydown', down, { passive: true })
        window.addEventListener('keyup', up, { passive: true })
        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
        }
    }, [])

    useFrame((_, delta) => {
        const k = keys.current
        const dt = Math.min(delta, 0.05) // cap delta to avoid post-tab-switch jumps

        // ── Rotation: Arrow Left / Arrow Right turns the player ──────
        if (k['ArrowLeft']) playerRef.current.yaw -= YAW_SPEED * dt
        if (k['ArrowRight']) playerRef.current.yaw += YAW_SPEED * dt

        // ── Movement: relative to current facing direction ────────────
        // Forward vector  : ( sin(yaw),  0,  cos(yaw) )
        // Strafe-right vec: ( cos(yaw),  0, -sin(yaw) )
        const yaw = playerRef.current.yaw
        const fwdX = Math.sin(yaw)
        const fwdZ = Math.cos(yaw)
        const sideX = Math.cos(yaw)
        const sideZ = -Math.sin(yaw)
        const spd = PLAYER_SPEED * dt

        let dx = 0, dz = 0
        if (k['w'] || k['W'] || k['ArrowUp']) { dx += fwdX * spd; dz += fwdZ * spd }
        if (k['s'] || k['S'] || k['ArrowDown']) { dx -= fwdX * spd; dz -= fwdZ * spd }
        if (k['a'] || k['A']) { dx -= sideX * spd; dz -= sideZ * spd }
        if (k['d'] || k['D']) { dx += sideX * spd; dz += sideZ * spd }

        if (dx !== 0 || dz !== 0) {
            playerRef.current.x += dx
            playerRef.current.z += dz
            // Keep player snapped to terrain surface
            playerRef.current.y = getTerrainHeight(playerRef.current.x, playerRef.current.z)
            // Notify chunk system so it can load/unload tiles
            onChunkChange(playerRef.current.x, playerRef.current.z)
        }
    })

    return null
}


// ─────────────────────────────────────────────────────────────
// CAMERA RIG
// Smooth third-person camera: orbits behind the player using
// the player's yaw angle, elevated by CAM_HEIGHT.
// Lerps toward the target position each frame (CAM_LERP).
// ─────────────────────────────────────────────────────────────

function CameraRig({ playerRef }) {
    const { camera } = useThree()
    const camPos = useRef(new THREE.Vector3(0, CAM_HEIGHT, CAM_DIST))
    const lookAt = useRef(new THREE.Vector3(0, 0, 0))

    useEffect(() => {
        // Snap to initial position so there is no startup sweep
        camera.position.set(0, CAM_HEIGHT, CAM_DIST)
        camera.lookAt(0, 0, 0)
    }, [camera])

    useFrame(() => {
        const { x, y, z, yaw } = playerRef.current

        // Back-offset: opposite of forward vector, scaled by CAM_DIST
        // Forward = (sin yaw, 0, cos yaw) → behind = (–sin yaw, 0, –cos yaw)
        const backX = -Math.sin(yaw) * CAM_DIST
        const backZ = -Math.cos(yaw) * CAM_DIST

        // Target: elevated point directly behind the player along yaw
        const targetPos = new THREE.Vector3(x + backX, y + CAM_HEIGHT, z + backZ)
        // Look-at: slightly above the player's feet, in their facing direction
        const targetLook = new THREE.Vector3(x, y + 1.8, z)

        // Smooth lerp toward target
        camPos.current.lerp(targetPos, CAM_LERP)
        lookAt.current.lerp(targetLook, CAM_LERP)

        camera.position.copy(camPos.current)
        camera.lookAt(lookAt.current)
    })

    return null
}


// ─────────────────────────────────────────────────────────────
// CHUNK SYSTEM HOOK
// Maintains a list of active chunks centred on the player.
// Only triggers a state update when the player crosses a
// chunk boundary, minimising React re-renders.
// ─────────────────────────────────────────────────────────────

function useChunkSystem() {
    /** Build the full array of chunks centred at (pcx, pcz) */
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

    /** Call this whenever the player moves; internally throttled to chunk boundaries. */
    const update = useCallback((px, pz) => {
        const pcx = Math.floor(px / CHUNK_SIZE)
        const pcz = Math.floor(pz / CHUNK_SIZE)
        // Only rebuild the list when the player enters a new chunk tile
        if (pcx === lastCX.current && pcz === lastCZ.current) return
        lastCX.current = pcx
        lastCZ.current = pcz
        setChunks(buildChunkList(pcx, pcz))
    }, [])

    return [chunks, update]
}


// ─────────────────────────────────────────────────────────────
// COORD TRACKER
// Samples player position each frame and reports to the HTML
// overlay (throttled to avoid flooding React state updates).
// ─────────────────────────────────────────────────────────────

function CoordTracker({ playerRef, onUpdate }) {
    useFrame(() => {
        onUpdate(playerRef.current.x, playerRef.current.z)
    })
    return null
}


// ─────────────────────────────────────────────────────────────
// SCENE
// Assembles the entire 3-D world: lighting, fog, stars,
// terrain chunks, objects, signs, portal, and player/cam.
// ─────────────────────────────────────────────────────────────

function Scene({ onCoordsUpdate }) {
    // Player state lives in a ref (mutations, never triggers re-renders)
    // yaw: facing angle in radians (0 = looking toward +Z, increases clockwise)
    const playerRef = useRef({ x: 0, y: 0, z: 0, yaw: 0 })
    const [chunks, updateChunks] = useChunkSystem()

    return (
        <>
            {/* ── Lighting ───────────────────────────────────────── */}
            <ambientLight color="#0d1533" intensity={1.8} />
            <directionalLight position={[60, 100, 50]} intensity={0.5} color="#3355bb" />
            {/* Floating blue orb over the origin for dramatic top lighting */}
            <pointLight position={[0, 50, 0]} color="#0033bb" intensity={4} distance={150} decay={1.5} />

            {/* ── Atmosphere ─────────────────────────────────────── */}
            {/* Fog seamlessly blends distant terrain into the sky colour */}
            <fog attach="fog" args={[SKY_COLOR, 60, 170]} />

            {/* ── Stars ──────────────────────────────────────────── */}
            <Stars radius={130} depth={40} count={3500} factor={3.5} fade speed={0.4} />

            {/* ── Terrain Chunks ─────────────────────────────────── */}
            {chunks.map(c => (
                <TerrainChunk key={`t-${c.key}`} cx={c.cx} cz={c.cz} />
            ))}

            {/* ── Decorative Objects (pillar/cubes per chunk) ─────── */}
            {chunks.map(c => (
                <ChunkObjects key={`o-${c.key}`} cx={c.cx} cz={c.cz} />
            ))}

            {/* ── 404 World Signage ──────────────────────────────── */}
            <Suspense fallback={null}>
                {/* Giant hero "404" hovering near spawn */}
                <FloatingSign position={[0, 16, -18]} text="404" fontSize={11} color="#00ffee" speed={0.55} />
                {/* Distant landmarks scattered across the world */}
                <FloatingSign position={[38, 12, 50]} text="Page Not Found" fontSize={2.8} color="#ff44aa" speed={0.90} />
                <FloatingSign position={[-50, 10, 40]} text="Keep exploring…" fontSize={2.2} color="#aaaaff" speed={0.50} />
                <FloatingSign position={[75, 12, -50]} text="You are lost" fontSize={2.4} color="#ffaa22" speed={0.72} />
                <FloatingSign position={[-80, 10, -80]} text="404" fontSize={7} color="#5533ff" speed={0.38} />
                <FloatingSign position={[0, 9, 90]} text="∞" fontSize={6} color="#00eeff" speed={1.10} />
                <FloatingSign position={[-30, 11, -80]} text="null://world" fontSize={1.8} color="#ff6688" speed={0.62} />
                <FloatingSign position={[100, 14, 20]} text="LOST" fontSize={4} color="#446688" speed={0.44} />
            </Suspense>

            {/* ── Portal ─────────────────────────────────────────── */}
            <Suspense fallback={null}>
                <Portal />
            </Suspense>

            {/* ── Player Controller (invisible logic node) ─────────── */}
            <PlayerController playerRef={playerRef} onChunkChange={updateChunks} />

            {/* ── Camera Rig (invisible logic node) ─────────────── */}
            <CameraRig playerRef={playerRef} />

            {/* ── Coordinate reporter to HTML overlay ───────────── */}
            <CoordTracker playerRef={playerRef} onUpdate={onCoordsUpdate} />
        </>
    )
}


// ─────────────────────────────────────────────────────────────
// WORLD 404  ── Main export
// ─────────────────────────────────────────────────────────────

export default function World404() {
    // Coordinates displayed in the corner of the screen
    const [coords, setCoords] = useState({ x: 0, z: 0 })

    // Throttle HTML re-renders: only update when player moves > 6 units
    const handleCoordsUpdate = useCallback((x, z) => {
        setCoords(prev => {
            if (Math.abs(prev.x - x) > 6 || Math.abs(prev.z - z) > 6) {
                return { x: Math.round(x), z: Math.round(z) }
            }
            return prev
        })
    }, [])

    return (
        <div style={styles.root}>

            {/* ── Vignette overlay for depth ─────────────────────── */}
            <div style={styles.vignette} />

            {/* ── Top label ──────────────────────────────────────── */}
            <div style={styles.topOverlay}>
                <span style={styles.titleText}>
                    404 — You are lost in the void
                </span>
            </div>

            {/* ── Bottom instructions ────────────────────────────── */}
            <div style={styles.bottomOverlay}>
                <span style={styles.hintText}>
                    WASD to move &nbsp;·&nbsp; ← → Arrow Keys to rotate &nbsp;·&nbsp; Click the portal to return home
                </span>
            </div>

            {/* ── Coordinates ────────────────────────────────────── */}
            <div style={styles.coordsOverlay}>
                <span style={styles.coordsText}>
                    {String(coords.x).padStart(6, '\u00A0')}, {String(coords.z).padStart(6, '\u00A0')}
                </span>
            </div>

            {/* ── Three.js Canvas ────────────────────────────────── */}
            <Canvas
                style={styles.canvas}
                camera={{ fov: 60, near: 0.1, far: 260 }}
                gl={{ antialias: true, alpha: false }}
                onCreated={({ gl, scene }) => {
                    gl.setClearColor(new THREE.Color(SKY_COLOR))
                    scene.background = new THREE.Color(SKY_COLOR)
                    // Slightly warm tone-mapping for atmosphere
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
// INLINE STYLES
// Kept here to make the component fully self-contained.
// ─────────────────────────────────────────────────────────────

const styles = {
    root: {
        width: '100vw',
        height: '100vh',
        background: SKY_COLOR,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Space Mono", "Courier New", Courier, monospace',
        userSelect: 'none',
    },

    // Radial vignette: darkens edges and softens the horizon
    vignette: {
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, #000000cc 100%)',
    },

    // ── UI panels ──────────────────────────────────────────────

    topOverlay: {
        position: 'absolute',
        top: 28,
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 10,
        pointerEvents: 'none',
    },
    titleText: {
        color: '#00ffee',
        fontSize: '0.82rem',
        letterSpacing: '0.38em',
        textTransform: 'uppercase',
        textShadow: '0 0 10px #00ffee, 0 0 28px #00ffee55',
    },

    bottomOverlay: {
        position: 'absolute',
        bottom: 28,
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 10,
        pointerEvents: 'none',
    },
    hintText: {
        color: '#2a3f55',
        fontSize: '0.62rem',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
    },

    coordsOverlay: {
        position: 'absolute',
        bottom: 28,
        right: 28,
        zIndex: 10,
        pointerEvents: 'none',
    },
    coordsText: {
        color: '#1a2d40',
        fontSize: '0.58rem',
        letterSpacing: '0.12em',
        fontFamily: 'monospace',
    },

    canvas: {
        position: 'absolute',
        inset: 0,
    },
}