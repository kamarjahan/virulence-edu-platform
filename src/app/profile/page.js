"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Using setDoc to fix "No document" error
import { updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'; // Added re-auth imports
import Navbar from '@/components/Navbar';
import { FaUserEdit, FaBookReader, FaLock, FaSave, FaSignOutAlt } from 'react-icons/fa';

export default function Profile() {
  const [user, setUser] = useState(null);
  // Initialize with empty strings to prevent input errors
  const [profile, setProfile] = useState({ name: '', phone: '', email: '', course: '', photo: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Password Change State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  // 1. Fetch Data
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || u.email || '',
            course: data.course || 'Not Allotted',
            photo: data.photo || ''
          });
        } else {
          // Defaults if no DB entry exists
          setProfile({
             name: u.displayName || '', 
             email: u.email || '', 
             photo: u.photoURL || '', 
             course: 'Not Allotted', 
             phone: '' 
          });
        }
      } else {
        window.location.href = '/'; // Redirect if not logged in
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Update Profile Handler (Using setDoc to fix missing file error)
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: profile.name,
        phone: profile.phone,
        photo: profile.photo,
        email: profile.email
      }, { merge: true });
      
      setEditing(false);
      alert("Profile Updated Successfully!");
    } catch (err) {
      alert("Error updating profile: " + err.message);
    }
  };

  // 3. Change Password Handler (With Re-authentication)
  const handleChangePassword = async () => {
    if (!newPass || !currentPass) return setPassMsg("Please enter both current and new passwords.");
    
    setPassMsg("Verifying...");
    try {
      // Step A: Re-authenticate User (Security Check)
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      
      // Step B: Update Password
      await updatePassword(user, newPass);
      
      setPassMsg("Success! Logging out...");
      setTimeout(() => {
        signOut(auth);
        window.location.href = '/';
      }, 2000);

    } catch (err) {
      console.error(err);
      if(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassMsg("Incorrect Current Password.");
      } else if (err.code === 'auth/requires-recent-login') {
        setPassMsg("Session timeout. Please Log Out and Log In again.");
      } else {
        setPassMsg("Error: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        
        {/* HEADER SECTION */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
          <div className="bg-slate-900 h-32 relative"></div>
          <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-12 gap-6">
            <div className="relative">
                <img src={profile.photo || "https://i.ibb.co/5cQ3t0N/user-placeholder.png"} 
                     alt="Profile" 
                     className="w-32 h-32 rounded-full border-4 border-white bg-white object-cover shadow-md" />
            </div>
            <div className="flex-1 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                <p className="text-slate-500 text-sm">{profile.email}</p>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
                <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition">
                   <FaUserEdit /> {editing ? "Cancel" : "Edit Profile"}
                </button>
                <button onClick={() => signOut(auth)} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold text-sm transition border border-red-100">
                   <FaSignOutAlt /> Sign Out
                </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            {/* LEFT: DETAILS FORM */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><FaUserEdit className="text-teal-600"/> Personal Details</h2>
                
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                            <input disabled={!editing} value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} 
                                   className={`w-full p-2 border rounded ${editing ? 'bg-white border-teal-500' : 'bg-slate-50'}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Phone Number</label>
                            <input disabled={!editing} value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} 
                                   placeholder="+91..."
                                   className={`w-full p-2 border rounded ${editing ? 'bg-white border-teal-500' : 'bg-slate-50'}`} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email (Read Only)</label>
                        <input disabled value={profile.email || ''} className="w-full p-2 border rounded bg-slate-100 text-slate-500 cursor-not-allowed" />
                    </div>

                    {editing && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Profile Photo (ImgBB Link)</label>
                            <div className="flex gap-2">
                                <input value={profile.photo || ''} onChange={e => setProfile({...profile, photo: e.target.value})} 
                                       placeholder="Paste ImgBB or Image URL here"
                                       className="w-full p-2 border rounded bg-white" />
                                <a href="https://imgbb.com" target="_blank" className="bg-slate-200 px-3 py-2 rounded text-xs font-bold flex items-center">Upload</a>
                            </div>
                        </div>
                    )}

                    {editing && (
                        <div className="pt-2">
                            <button className="bg-teal-600 text-white px-6 py-2 rounded font-bold hover:bg-teal-700 flex items-center gap-2 transition">
                                <FaSave /> Save Changes
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* RIGHT: COURSE & SECURITY */}
            <div className="space-y-6">
                
                {/* COURSE CARD */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><FaBookReader className="text-teal-600"/> Allotted Course</h2>
                    <div className="bg-teal-50 border border-teal-100 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-teal-700">{profile.course || "None"}</div>
                        <p className="text-xs text-teal-600 mt-1">Status: Active</p>
                    </div>
                </div>

                {/* PASSWORD CARD */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><FaLock className="text-teal-600"/> Security</h2>
                    <div className="space-y-3">
                        <input type="password" placeholder="Current Password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} 
                               className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white" />
                        <input type="password" placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} 
                               className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white" />
                        
                        <button onClick={handleChangePassword} className="w-full bg-slate-900 text-white py-2 rounded font-bold text-sm hover:bg-slate-800 transition">
                            Update Password
                        </button>
                        
                        {passMsg && (
                            <p className={`text-xs text-center font-bold p-2 rounded ${passMsg.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                                {passMsg}
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}