import './Modal.css'

export default function Modal({ isOpen, title, message, onButtonClick, buttonText = 'Okay' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container glass-card fade-in">
        <div className="modal-icon">⚠️</div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <button className="btn btn-primary btn-lg modal-btn" onClick={onButtonClick}>
          {buttonText}
        </button>
      </div>
    </div>
  )
}
