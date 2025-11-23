"use client";
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { FaLaptopCode, FaGlobeAsia, FaWhatsapp, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', msg: '' });

  // 1. Fetch Courses from Database
  useEffect(() => {
    const fetchCourses = async () => {
      const snap = await getDocs(collection(db, "courses"));
      setCourses(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchCourses();
  }, []);

  // 2. Handle Contact Form Submission
  const handleEnquiry = async (e) => {
    e.preventDefault();
    if(!enquiry.name || !enquiry.phone) return alert("Please fill in your Name and Phone number.");
    
    try {
      await addDoc(collection(db, "contacts"), { 
        ...enquiry, 
        date: new Date().toISOString() 
      });
      alert("Enquiry Sent! Our academic counselor will call you shortly.");
      setEnquiry({ name: '', phone: '', msg: '' });
    } catch (error) {
      alert("Error sending message: " + error.message);
    }
  };

  const filteredCourses = filter === 'All' ? courses : courses.filter(c => c.category === filter);

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-slate-900 text-white py-24 px-6 text-center relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/20 to-slate-900 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="text-teal-400 font-bold tracking-widest text-xs uppercase mb-3 block border-teal-500/30 border w-fit mx-auto px-3 py-1 rounded-full bg-slate-800/50">
            100% Online • Live Interactive Classes
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Virulence <span className="text-teal-500">Digital Campus</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Master NEET & Science from the comfort of your home. Kerala's most trusted faculty is now on your screen.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a href="#courses" className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-teal-900/50 transition transform hover:-translate-y-1">
              View Online Batches
            </a>
            <a href="#contact" className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white px-8 py-4 rounded-full font-bold transition">
              Book Free Consultation
            </a>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="bg-white border-b py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "5000+", label: "Students Trained" },
            { num: "98%", label: "Pass Rate" },
            { num: "Live", label: "Interactive Classes" },
            { num: "24/7", label: "Doubt Support" }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-slate-900">{stat.num}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COURSE GRID SECTION */}
      <section id="courses" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Academic Programs</h2>
            <p className="text-slate-500">Select a category to filter courses</p>
        </div>

        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {['All', '10th Science', '11th Science', '12th Science', 'Entrance'].map(cat => (
             <button key={cat} onClick={() => setFilter(cat)} 
               className={`px-5 py-2 rounded-full text-sm font-bold transition ${filter === cat ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
               {cat}
             </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {filteredCourses.length > 0 ? filteredCourses.map(c => (
            <Link href={`/course/${c.id}`} key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group block hover:-translate-y-1">
              <div className="h-48 bg-slate-200 overflow-hidden relative">
                {c.image ? (
                    <img src={c.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={c.title}/>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-100">No Image</div>
                )}
                <span className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2 py-1 text-[10px] font-bold uppercase rounded text-teal-700 shadow-sm border border-teal-100">
                    Online Batch
                </span>
              </div>
              <div className="p-6">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1 block">{c.category}</span>
                <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">{c.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{c.desc}</p>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                  <span className="font-bold text-xl text-slate-800">₹{c.price}</span>
                  <span className="text-teal-600 text-sm font-bold group-hover:underline flex items-center gap-1">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            </Link>
          )) : (
            <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <p>No courses found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* CONTACT & LEAD GEN SECTION */}
      <section className="bg-white border-t border-slate-200 py-20 px-6" id="contact">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Join Our Digital Campus</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
                Have questions about admissions, fees, or syllabus? Fill out the form, and our Academic Coordinator will contact you directly.
            </p>
            
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 shrink-0"><FaGlobeAsia /></div>
                    <div>
                        <h4 className="font-bold text-slate-900">Online Learning</h4>
                        <p className="text-sm text-slate-500">Live Classes via Virulence App & Web</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 shrink-0"><FaEnvelope /></div>
                    <div>
                        <h4 className="font-bold text-slate-900">Email Support</h4>
                        <p className="text-sm text-slate-500">contact@kamarjahan.in</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 shrink-0"><FaWhatsapp /></div>
                    <div>
                        <h4 className="font-bold text-slate-900">WhatsApp</h4>
                        <p className="text-sm text-slate-500">+91 98765 43210</p>
                    </div>
                </div>
            </div>
          </div>

          <form onSubmit={handleEnquiry} className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6 text-slate-900">Quick Enquiry</h3>
            <div className="space-y-4">
                <input 
                    placeholder="Student Name" 
                    className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 transition" 
                    onChange={e => setEnquiry({...enquiry, name: e.target.value})} 
                    value={enquiry.name} 
                />
                <input 
                    placeholder="Phone / WhatsApp Number" 
                    className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 transition" 
                    onChange={e => setEnquiry({...enquiry, phone: e.target.value})} 
                    value={enquiry.phone} 
                />
                <textarea 
                    placeholder="Message / Course Interest" 
                    className="w-full p-3 bg-white border border-slate-300 rounded-lg h-32 focus:outline-none focus:border-teal-500 transition" 
                    onChange={e => setEnquiry({...enquiry, msg: e.target.value})} 
                    value={enquiry.msg}
                ></textarea>
                <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition shadow-lg">
                    Submit Enquiry
                </button>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 text-center text-sm border-t border-slate-800">
        <p className="mb-2">&copy; 2025 Virulence Education Centre. All rights reserved.</p>
        <p>Built with Next.js & Firebase</p>
      </footer>
    </main>
  );
}