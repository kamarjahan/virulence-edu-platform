"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../../components/Navbar';
import { FaTrash, FaCheckCircle, FaBook, FaUserFriends, FaClipboardList, FaHeadset, FaUserShield, FaEdit } from 'react-icons/fa';

export default function AdminPanel() {
  const [tab, setTab] = useState('courses');
  const [currentUserData, setCurrentUserData] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  
  // Data States
  const [courses, setCourses] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [admins, setAdmins] = useState([]); // List of admin users

  // Forms
  const [courseForm, setCourseForm] = useState({ title: '', category: 'Entrance', price: '', image: '', desc: '' });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', role: 'Staff' });
  
  // Chat
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [adminMsg, setAdminMsg] = useState('');

  // 1. SECURITY & INITIAL LOAD
  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if(u) {
        // Fetch User Role
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", u.email)));
        if (!userDoc.empty) {
            const data = userDoc.docs[0].data();
            setCurrentUserData(data);
            // Check Access (Any admin role OR the owner email)
            if (['Full Control', 'Manager', 'Staff', 'Viewer'].includes(data.role) || u.email === 'contact@kamarjahan.in') {
                setAuthorized(true);
                fetchData();
            }
        }
      }
    });
  }, []);

  const fetchData = async () => {
    // 1. Courses
    const cSnap = await getDocs(collection(db, "courses"));
    setCourses(cSnap.docs.map(d => ({...d.data(), id: d.id})));
    
    // 2. Contacts
    const conSnap = await getDocs(collection(db, "contacts"));
    setContacts(conSnap.docs.map(d => ({...d.data(), id: d.id})));
    
    // 3. Enrollments
    const enSnap = await getDocs(collection(db, "enrollments"));
    setEnrollments(enSnap.docs.map(d => ({...d.data(), id: d.id})));
    
    // 4. Team (Admins)
    // Fetch users who are NOT students
    const adminQuery = query(collection(db, "users"), where("role", "in", ['Full Control', 'Manager', 'Staff', 'Viewer']));
    const adminSnap = await getDocs(adminQuery);
    setAdmins(adminSnap.docs.map(d => ({...d.data(), id: d.id})));

    // 5. Tickets (Realtime)
    onSnapshot(collection(db, "tickets"), snap => setTickets(snap.docs.map(d => ({...d.data(), id: d.id}))));
  };

  // --- ACTIONS ---

  // A. MANAGE ENROLLMENT (Sync to User Profile)
  const updateEnrollmentStatus = async (enrollment, newStatus) => {
    if (currentUserData?.role === 'Viewer') return alert("Viewers cannot edit.");
    
    try {
        // 1. Update Enrollment Doc
        await updateDoc(doc(db, "enrollments", enrollment.id), { status: newStatus });
        
        // 2. IF Active/Allotted -> Find User by Email and Update their Profile Course
        if (newStatus === 'Active' || newStatus === 'Allotted') {
            const q = query(collection(db, "users"), where("email", "==", enrollment.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (d) => {
                    await updateDoc(doc(db, "users", d.id), { 
                        course: enrollment.courseTitle,
                    });
                });
                alert(`Status Updated & Course allotted to ${enrollment.name}'s profile.`);
            } else {
                alert("Status updated, but User Account not found (they might have signed up with a different email).");
            }

        } else if (newStatus === 'Dismissed' || newStatus === 'Pending') {
             // If dismissed, remove course from profile
             const q = query(collection(db, "users"), where("email", "==", enrollment.email));
             const querySnapshot = await getDocs(q);
             querySnapshot.forEach(async (d) => {
                await updateDoc(doc(db, "users", d.id), { course: 'Not Allotted' });
            });
            alert("Status updated & Course removed from profile.");
        }
        
        fetchData(); // Refresh UI
    } catch (e) {
        alert("Error: " + e.message);
    }
  };

  // B. ADD NEW ADMIN
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    // Only "Full Control" or the Owner can add staff
    if (currentUserData?.role !== 'Full Control' && currentUserData?.email !== 'contact@kamarjahan.in') {
        return alert("Only Full Control admins can add new staff.");
    }

    const q = query(collection(db, "users"), where("email", "==", adminForm.email));
    const snap = await getDocs(q);
    
    if (snap.empty) {
        alert("User must sign up as a student first, then you can promote them here.");
    } else {
        const uid = snap.docs[0].id;
        await updateDoc(doc(db, "users", uid), { role: adminForm.role, name: adminForm.name });
        alert(`${adminForm.name} is now a ${adminForm.role}`);
        setAdminForm({ name: '', email: '', role: 'Staff' });
        fetchData();
    }
  };

  // C. DELETE FUNCTIONS
  const deleteEnrollment = async (id) => {
    if(currentUserData?.role === 'Staff' || currentUserData?.role === 'Viewer') return alert("Access Denied");
    if(confirm("Permanently delete this enrollment record?")) {
        await deleteDoc(doc(db, "enrollments", id));
        fetchData();
    }
  };

  const deleteCourse = async (id) => {
      if(currentUserData?.role === 'Staff' || currentUserData?.role === 'Viewer') return alert("Access Denied");
      if(confirm("Delete Course?")) { 
          await deleteDoc(doc(db, "courses", id)); 
          fetchData(); 
      }
  }

  // D. TICKET CHAT LOGIC
  useEffect(() => {
    if(!activeTicket) return;
    const q = query(collection(db, "tickets", activeTicket.id, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, snap => setMessages(snap.docs.map(d => d.data())));
    return () => unsub();
  }, [activeTicket]);

  const closeTicket = async () => {
    if(confirm("Mark Solved?")) await updateDoc(doc(db, "tickets", activeTicket.id), { status: 'Closed' });
  };
  
  const sendAdminReply = async () => {
    if(!adminMsg) return;
    await addDoc(collection(db, "tickets", activeTicket.id, "messages"), { text: adminMsg, sender: 'admin', createdAt: new Date().toISOString() });
    setAdminMsg('');
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if(currentUserData?.role === 'Viewer') return alert("Viewers cannot add courses.");
    await addDoc(collection(db, "courses"), courseForm);
    alert("Course Added");
    fetchData(); 
  };

  if(!authorized) return <div className="p-10 text-center text-red-600 font-bold">Access Denied</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">
                Role: <span className="font-bold text-teal-400">{currentUserData?.role || 'Super Admin'}</span>
            </div>
        </div>
        
        {/* TABS NAVIGATION */}
        <div className="flex flex-wrap gap-4 mb-8 border-b pb-4">
          {[
            { id: 'courses', icon: <FaBook/>, label: 'Courses' },
            { id: 'enrollments', icon: <FaClipboardList/>, label: 'Enrollments' },
            { id: 'team', icon: <FaUserShield/>, label: 'Team' },
            { id: 'enquiries', icon: <FaUserFriends/>, label: 'Enquiries' },
            { id: 'tickets', icon: <FaHeadset/>, label: 'Support' }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition ${tab===t.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-200'}`}>
                {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* --- TAB: TEAM (MANAGE ADMINS) --- */}
        {tab === 'team' && (
            <div className="grid md:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white p-6 rounded shadow h-fit">
                    <h3 className="font-bold border-b pb-2 mb-4">Promote User to Staff</h3>
                    <p className="text-xs text-slate-400 mb-4">User must already have signed up as a student.</p>
                    <form onSubmit={handleAddAdmin} className="space-y-3">
                        <input placeholder="Search by Email" className="w-full border p-2 rounded" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
                        <input placeholder="Name (Optional)" className="w-full border p-2 rounded" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} />
                        <select className="w-full border p-2 rounded" value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value})}>
                            <option value="Full Control">Full Control (Super Admin)</option>
                            <option value="Manager">Manager (No Team Edit)</option>
                            <option value="Staff">Staff (No Deletes)</option>
                            <option value="Viewer">Viewer (Read Only)</option>
                        </select>
                        <button className="bg-teal-600 text-white w-full py-2 rounded font-bold">Assign Role</button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2 space-y-3">
                    {admins.map(admin => (
                        <div key={admin.id} className="bg-white p-4 border rounded flex justify-between items-center">
                            <div>
                                <p className="font-bold">{admin.name || 'Unnamed'}</p>
                                <p className="text-xs text-slate-500">{admin.email}</p>
                            </div>
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase 
                                ${admin.role==='Full Control' ? 'bg-red-100 text-red-700' : 
                                  admin.role==='Manager' ? 'bg-orange-100 text-orange-700' : 
                                  admin.role==='Staff' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>
                                {admin.role}
                            </span>
                        </div>
                    ))}
                    {admins.length === 0 && <p className="text-slate-400">No other admins found.</p>}
                </div>
            </div>
        )}

        {/* --- TAB: COURSES --- */}
        {tab === 'courses' && (
          <div className="grid md:grid-cols-3 gap-8">
             <form onSubmit={handleCourseSubmit} className="bg-white p-6 rounded shadow h-fit space-y-3">
               <h3 className="font-bold border-b pb-2">Add New Course</h3>
               <div>
                 <label className="text-xs font-bold text-slate-500">Course Title</label>
                 <input className="w-full border p-2 rounded" onChange={e => setCourseForm({...courseForm, title: e.target.value})}/>
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500">Category</label>
                 <select className="w-full border p-2 rounded" value={courseForm.category} onChange={e => setCourseForm({...courseForm, category: e.target.value})}>
                    <option value="10th Science">10th Science</option>
                    <option value="11th Science">11th Science</option>
                    <option value="12th Science">12th Science</option>
                    <option value="Entrance">Entrance (NEET/KEAM)</option>
                 </select>
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500">Price (₹)</label>
                 <input type="number" className="w-full border p-2 rounded" onChange={e => setCourseForm({...courseForm, price: e.target.value})}/>
               </div>
               <input placeholder="ImgBB URL" className="w-full border p-2 rounded" onChange={e => setCourseForm({...courseForm, image: e.target.value})}/>
               <textarea placeholder="Description" className="w-full border p-2 rounded h-20" onChange={e => setCourseForm({...courseForm, desc: e.target.value})}/>
               <button className="bg-teal-600 text-white w-full py-2 rounded font-bold hover:bg-teal-700">Upload Course</button>
             </form>
             
             <div className="md:col-span-2 space-y-2">
               {courses.map(c => (
                 <div key={c.id} className="flex justify-between bg-white p-3 border rounded items-center">
                   <div>
                       <div className="font-bold">{c.title}</div>
                       <div className="text-xs text-slate-500">{c.category} • ₹{c.price}</div>
                   </div>
                   <button onClick={() => deleteCourse(c.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><FaTrash/></button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* --- TAB: ENROLLMENTS --- */}
        {tab === 'enrollments' && (
           <div className="space-y-4">
             {enrollments.length === 0 && <p className="text-slate-400">No enrollments received yet.</p>}
             {enrollments.map(en => (
               <div key={en.id} className="bg-white p-6 rounded border shadow-sm flex flex-col md:flex-row justify-between items-start gap-4">
                 <div>
                    <h3 className="font-bold text-lg text-slate-800">{en.name}</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-600 mt-2">
                        <p><span className="font-bold">Phone:</span> {en.phone}</p>
                        <p><span className="font-bold">Guardian:</span> {en.guardianPhone}</p>
                        <p><span className="font-bold">Email:</span> {en.email}</p>
                        <p><span className="font-bold">Course:</span> {en.courseTitle}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 items-center">
                        <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${en.paymentMethod === 'Full Payment' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {en.paymentMethod}
                        </span>
                        
                        {/* STATUS DROPDOWN */}
                        <div className="flex items-center gap-2 border-l pl-4">
                            <label className="text-xs font-bold text-slate-400 uppercase">Status:</label>
                            <select 
                                value={en.status || 'Pending'} 
                                onChange={(e) => updateEnrollmentStatus(en, e.target.value)}
                                className={`border p-1 rounded text-sm font-bold ${
                                    en.status === 'Active' ? 'text-green-600 bg-green-50' : 
                                    en.status === 'Dismissed' ? 'text-red-600 bg-red-50' : 'text-slate-600'
                                }`}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Active">Active (Allot Course)</option>
                                <option value="Dismissed">Dismissed</option>
                            </select>
                        </div>
                    </div>
                 </div>
                 <button onClick={() => deleteEnrollment(en.id)} className="text-red-500 border border-red-200 px-4 py-2 rounded hover:bg-red-50 font-bold text-sm">
                    Delete Record
                 </button>
               </div>
             ))}
           </div>
        )}

        {/* --- TAB: ENQUIRIES --- */}
        {tab === 'enquiries' && (
           <div className="space-y-3">
             {contacts.map(c => (
               <div key={c.id} className="bg-white p-4 border rounded shadow-sm">
                 <p className="font-bold text-lg">{c.name} <span className="text-sm font-normal text-slate-500">({c.phone})</span></p>
                 <p className="text-slate-600">{c.msg}</p>
                 <p className="text-xs text-slate-400 mt-2">{new Date(c.date).toLocaleDateString()}</p>
               </div>
             ))}
           </div>
        )}

        {/* --- TAB: TICKETS --- */}
        {tab === 'tickets' && (
          <div className="grid md:grid-cols-3 gap-6 h-[600px]">
            <div className="space-y-2 overflow-y-auto border-r pr-2">
               {tickets.map(t => (
                 <div key={t.id} onClick={() => setActiveTicket(t)} className={`p-3 border rounded cursor-pointer ${activeTicket?.id === t.id ? 'bg-teal-50 border-teal-500' : 'bg-white'}`}>
                   <p className="font-bold text-sm truncate">{t.subject}</p>
                   <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-400">{t.studentEmail}</span>
                      <span className={`text-[10px] px-1 rounded ${t.status==='Open'?'bg-green-100 text-green-700':'bg-slate-200'}`}>{t.status}</span>
                   </div>
                 </div>
               ))}
            </div>
            
            <div className="md:col-span-2 bg-white border rounded flex flex-col">
               {activeTicket ? (
                 <>
                   <div className="p-3 border-b flex justify-between bg-slate-50 items-center">
                        <span className="font-bold">{activeTicket.studentEmail}</span>
                        {activeTicket.status === 'Open' ? (
                            <button onClick={closeTicket} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">Mark Solved</button>
                        ) : (
                            <span className="text-xs bg-slate-200 px-2 py-1 rounded">Closed</span>
                        )}
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((m, i) => (
                       <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] p-3 rounded-xl text-sm ${m.sender === 'admin' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-800'}`}>{m.text}</div>
                       </div>
                     ))}
                   </div>
                   {activeTicket.status === 'Open' && (
                    <div className="p-3 border-t flex gap-2">
                         <input className="flex-1 border p-2 rounded" placeholder="Reply..." value={adminMsg} onChange={e => setAdminMsg(e.target.value)}/>
                         <button onClick={sendAdminReply} className="bg-slate-900 text-white px-4 rounded font-bold">Reply</button>
                    </div>
                   )}
                 </>
               ) : <div className="flex items-center justify-center h-full text-slate-400">Select Ticket</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}