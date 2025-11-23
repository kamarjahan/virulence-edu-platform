"use client";
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { FaLaptopCode, FaGlobeAsia, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [enquiry, setEnquiry] = useState({ name: '', phone: '', msg: '' });

  useEffect(() => {
    getDocs(collection(db, "courses")).then(snap => setCourses(snap.docs.map(d => ({...d.data(), id: d.id}))));
  }, []);

  const handleEnquiry = async (e) => {
    e.preventDefault();
    if(!enquiry.name || !enquiry.phone) return alert("Please fill details");
    await addDoc(collection(db, "contacts"), { ...enquiry, date: new Date().toISOString() });
    alert("Enquiry Sent! Our academic counselor will call you.");
    setEnquiry({ name: '', phone: '', msg: '' });
  };

  const filtered = filter === 'All' ? courses : courses.filter(c => c.category === filter);

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ONLINE HERO */}
      <section className="bg-slate-900 text-white py-24 px-6 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="text-teal-400 font-bold tracking-widest text-xs uppercase mb-2 block">100% Online • Live Interactive Classes</span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">Virulence Digital Campus</h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">Master NEET & Science from the comfort of your home. Kerala's most trusted online faculty now on your screen.</p>
          <a href="#courses" className="bg-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-teal-400 transition">View Online Batches</a>
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {['All', '10th Science', '12th Science', 'Entrance'].map(cat => (
             <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1 rounded-full text-sm font-bold ${filter === cat ? 'bg-slate-800 text-white' : 'bg-white border'}`}>{cat}</button>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {filtered.map(c => (
            <Link href={`/course/${c.id}`} key={c.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-xl transition group block">
              <div className="h-48 bg-slate-200 overflow-hidden relative">
                {c.image && <img src={c.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={c.title}/>}
                <span className="absolute top-2 right-2 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase rounded text-teal-700">Online Batch</span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-slate-900 mb-1">{c.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{c.desc}</p>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="font-bold text-xl">₹{c.price}</span>
                  <span className="text-teal-600 text-sm font-bold group-hover:underline">View Details &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CONTACT FORM (Leads to Admin) */}
      <section className="bg-white border-t py-16 px-6" id="contact">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Join Our Digital Campus</h2>
            <p className="text-slate-600 mb-6">Fill the form to get a callback from our Academic Coordinator regarding online admissions.</p>
            <div className="space-y-4 text-sm font-medium text-slate-700">
                <div className="flex items-center gap-3"><FaGlobeAsia className="text-teal-600"/> Live Classes via Virulence App</div>
                <div className="flex items-center gap-3"><FaLaptopCode className="text-teal-600"/> Recorded Sessions Available</div>
                <div className="flex items-center gap-3"><FaEnvelope className="text-teal-600"/> contact@kamarjahan.in</div>
            </div>
          </div>
          <form onSubmit={handleEnquiry} className="bg-slate-50 p-6 rounded-xl border space-y-3">
            <input placeholder="Student Name" className="w-full p-3 border rounded" onChange={e => setEnquiry({...enquiry, name: e.target.value})} value={enquiry.name} />
            <input placeholder="WhatsApp Number" className="w-full p-3 border rounded" onChange={e => setEnquiry({...enquiry, phone: e.target.value})} value={enquiry.phone} />
            <textarea placeholder="Message / Course Interest" className="w-full p-3 border rounded h-24" onChange={e => setEnquiry({...enquiry, msg: e.target.value})} value={enquiry.msg}></textarea>
            <button className="w-full bg-slate-900 text-white py-3 rounded font-bold hover:bg-slate-800">Submit Enquiry</button>
          </form>
        </div>
      </section>
    </main>
  );
}