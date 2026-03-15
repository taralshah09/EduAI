import { Link } from 'react-router-dom'
import api from '../services/api'

export default function CourseCard({ course, onDelete }) {
  const status = course.status

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.delete(`/courses/${course._id}`);
      if (onDelete) onDelete();
    } catch (err) {
      console.error("Failed to delete course", err);
      alert("Failed to delete course.");
    }
  };

  return (
    <Link 
      to={`/course/${course._id}`} 
      className="group bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300 font-black italic">
            EDU
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
            status === 'ready' 
            ? 'bg-[#d9f99d] text-[#111827] border-black/5' 
            : status === 'error' 
            ? 'bg-red-500 text-white border-red-400' 
            : 'bg-[#111827] text-white border-white/10 animate-pulse'
          }`}>
            {status === 'ready' ? '✓ Ready' : status === 'error' ? '✗ Error' : '⏳ Building'}
          </span>
        </div>
      </div>

      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="font-display font-black text-xl uppercase tracking-tighter leading-none line-clamp-2 text-[#111827] group-hover:text-black transition-colors">
              {course.title}
            </h3>
            <button 
              onClick={handleDelete}
              className="text-gray-300 hover:text-red-500 transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lessons</span>
              <span className="font-black text-sm text-[#111827]">{course.lessonCount || 0}</span>
            </div>
            <div className="w-[1px] h-6 bg-gray-100"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Questions</span>
              <span className="font-black text-sm text-[#111827]">{(course.lessonCount || 0) * 5}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
