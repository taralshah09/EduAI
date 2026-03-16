

export default function Modal({ isOpen, title, message, onButtonClick, buttonText = 'Okay' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 sm:p-10">
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-dark/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={onButtonClick} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-[32px] p-8 md:p-10 shadow-2xl border-[1.5px] border-gray-100 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl mb-2 animate-bounce">
          ⚠️
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-black text-dark uppercase tracking-tighter leading-none">
            {title}
          </h2>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            {message}
          </p>
        </div>

        <button 
          className="w-full bg-primary text-dark font-black px-8 py-4 rounded-full uppercase tracking-tighter text-lg hover:brightness-105 transition-all shadow-md active:scale-95"
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}
