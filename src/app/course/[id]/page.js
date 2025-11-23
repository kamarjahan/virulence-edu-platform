"use client";
import { useState, useEffect, use } from 'react';
import { db, auth } from '@/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { FaPlayCircle, FaFilePdf, FaClock, FaTimes, FaCheckCircle } from 'react-icons/fa';

export default function CourseDetail({ params }) {
  const { id } = use(params);
  const [course, setCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Enrollment Form State
  const [form, setForm] = useState({
    name: '', email: '', phone: '', guardianPhone: '', paymentMethod: 'Full Payment'
  });

  useEffect(() => {
    if (id) {
      getDoc(doc(db, "courses", id)).then(d => d.exists() && setCourse(d.data()));
    }
  }, [id]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, "enrollments"), {
        ...form,
        courseId: id,
        courseTitle: course.title,
        price: course.price,
        status: 'Pending',
        date: new Date().toISOString()
      });
      alert("Enrollment Submitted Successfully! Our team will contact you for payment verification.");
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', guardianPhone: '', paymentMethod: 'Full Payment' });
    } catch (error) {
      alert("Error submitting form: " + error.message);
    }
    setLoading(false);
  };

  if(!course) return <div className="min-h-screen bg-slate-50"><Navbar /><div className="p-20 text-center animate-pulse">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Course Header */}
      <div className="bg-slate-900 text-white py-16 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">{course.title}</h1>
        <p className="text-teal-400 font-bold uppercase tracking-wide">{course.category} • Online Program</p>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 -mt-8">
        <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="flex flex-col md:flex-row gap-8 mb-8 border-b pb-8">
                <div className="w-full md:w-1/3 bg-slate-100 rounded-lg overflow-hidden h-64">
                    {course.image ? <img src={course.image} className="w-full h-full object-cover" /> : <div className="p-10 text-center">No Image</div>}
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4 text-slate-900">Program Overview</h2>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{course.desc}</p>
                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500 font-bold">
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full"><FaPlayCircle className="text-teal-600"/> Live Classes</span>
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full"><FaFilePdf className="text-teal-600"/> PDF Notes</span>
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full"><FaClock className="text-teal-600"/> 6 Months Access</span>
                    </div>
                </div>
            </div>
            
            <div className="text-center">
                <p className="text-slate-500 text-sm mb-2">Total Program Fee</p>
                <div className="text-4xl font-bold text-slate-900 mb-6">₹{course.price}</div>
                
                {/* ENROLL BUTTON */}
                <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-12 py-4 rounded-full font-bold shadow-lg hover:bg-teal-700 transition transform hover:-translate-y-1 text-lg">
                    Enroll Now
                </button>
                <p className="text-xs text-slate-400 mt-4">Secure Your Seat Today</p>
            </div>
        </div>
      </div>

      {/* ENROLLMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold text-lg">Admission Form</h3>
                <button onClick={() => setShowModal(false)}><FaTimes/></button>
            </div>
            
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Student Name</label>
                        <input required className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                        <input required type="email" className="w-full border p-2 rounded" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                        <input required type="tel" className="w-full border p-2 rounded" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Guardian Number</label>
                        <input required type="tel" className="w-full border p-2 rounded" value={form.guardianPhone} onChange={e => setForm({...form, guardianPhone: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`border p-3 rounded cursor-pointer text-center ${form.paymentMethod === 'Full Payment' ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'hover:bg-slate-50'}`}>
                            <input type="radio" name="pay" className="hidden" onClick={() => setForm({...form, paymentMethod: 'Full Payment'})} />
                            <div className="font-bold text-sm">Full Payment</div>
                            <div className="text-xs text-slate-500">₹{course.price}</div>
                        </label>
                        <label className={`border p-3 rounded cursor-pointer text-center ${form.paymentMethod === 'Half Payment' ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'hover:bg-slate-50'}`}>
                            <input type="radio" name="pay" className="hidden" onClick={() => setForm({...form, paymentMethod: 'Half Payment'})} />
                            <div className="font-bold text-sm">Half Payment</div>
                            <div className="text-xs text-slate-500">Rest within 1 week</div>
                        </label>
                    </div>
                </div>

                <button disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded font-bold hover:bg-slate-800 mt-4">
                    {loading ? 'Processing...' : 'Confirm Admission'}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}