"use client";
import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { FaGoogle, FaUserGraduate, FaTimes, FaHeadset, FaUserCircle, FaShieldAlt, FaBars } from 'react-icons/fa';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Auth State: 'login' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('login'); 
  
  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Feedback
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // 1. Monitor Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setShowModal(false);
        // Fetch User Role & Photo
        const docSnap = await getDoc(doc(db, "users", u.uid));
        if (docSnap.exists()) setUserData(docSnap.data());
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Google Login
  const handleGoogle = async () => {
    try { 
      const res = await signInWithPopup(auth, googleProvider);
      const u = res.user;
      
      // Save Google User to DB if new
      const userRef = doc(db, "users", u.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: u.displayName, 
          email: u.email, 
          photo: u.photoURL,
          phone: "", 
          course: "Not Allotted", 
          role: "student", 
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) { setError(e.message); }
  };

  // 3. Email Auth (Login & Sign Up)
  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    
    try {
      if (authMode === 'signup') {
        // A. CREATE ACCOUNT
        if(!name || !phone) return setError("Name and Phone are required for signup.");
        
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const u = res.user;
        
        // Update Auth Profile
        await updateProfile(u, { displayName: name });
        
        // Save to Firestore Database
        await setDoc(doc(db, "users", u.uid), {
          name: name,
          email: email,
          phone: phone,
          photo: "",
          course: "Not Allotted",
          role: "student",
          createdAt: new Date().toISOString()
        });
        
        setMsg("Account Created! Redirecting...");

      } else if (authMode === 'login') {
        // B. LOGIN
        await signInWithEmailAndPassword(auth, email, password);
      
      } else if (authMode === 'forgot') {
        // C. FORGOT PASSWORD
        await sendPasswordResetEmail(auth, email);
        setMsg('Reset link sent to your email!');
      }
    } catch (err) { 
        setError(err.message.replace("Firebase:", "").replace("auth/", "")); 
    }
  };

  // Helper to check Admin Role
  const isAdmin = userData?.role && ['Full Control', 'Manager', 'Staff', 'Viewer'].includes(userData.role);

  return (
    <>
      <nav className="bg-white/95 backdrop-blur border-b sticky top-0 z-50 h-16 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <Link href="/" className="font-bold text-xl tracking-tight text-slate-900">VIRULENCE <span className="text-teal-600">EDU</span></Link>
        
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="hidden md:block hover:text-teal-600">Home</Link>
          <Link href="/#courses" className="hidden md:block hover:text-teal-600">Courses</Link>
          
          {user && <Link href="/tickets" className="flex items-center gap-1 text-teal-600"><FaHeadset /> Support</Link>}

          {/* ADMIN BUTTON */}
          {(isAdmin || user?.email === 'contact@kamarjahan.in') && (
            <Link href="/admin" className="flex items-center gap-1 text-red-600 border border-red-200 px-2 py-1 rounded text-xs font-bold uppercase hover:bg-red-50">
               <FaShieldAlt/> {userData?.role || 'Admin'}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l ml-3">
               <Link href="/profile">
                 {userData?.photo ? (
                    <img src={userData.photo} className="w-9 h-9 rounded-full border object-cover" alt="User"/>
                 ) : (
                    <FaUserCircle className="text-3xl text-slate-400"/>
                 )}
               </Link>
            </div>
          ) : (
            <button onClick={() => { setShowModal(true); setAuthMode('login'); }} className="bg-slate-900 text-white px-5 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition">
              <FaUserGraduate /> Student Login
            </button>
          )}
        </div>
      </nav>

      {/* LOGIN / SIGNUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative overflow-hidden animate-fadeIn">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><FaTimes /></button>
            
            <div className="p-8">
               <h2 className="text-2xl font-bold mb-1 text-slate-900 capitalize">
                 {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
               </h2>
               <p className="text-slate-500 text-xs mb-6">Virulence Student Portal</p>

               {/* Feedback Messages */}
               {error && <p className="bg-red-50 text-red-600 p-3 rounded text-xs mb-4 font-semibold border border-red-100">{error}</p>}
               {msg && <p className="bg-green-50 text-green-600 p-3 rounded text-xs mb-4 font-semibold border border-green-100">{msg}</p>}

               {/* Google Button (Only for Login/Signup) */}
               {authMode !== 'forgot' && (
                 <button onClick={handleGoogle} className="w-full border border-slate-300 p-2.5 mb-5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 text-slate-700 hover:bg-slate-50 transition">
                    <FaGoogle className="text-red-500"/> Continue with Google
                 </button>
               )}
               
               {authMode !== 'forgot' && <div className="text-center text-xs text-slate-400 mb-4">- OR -</div>}

               {/* FORM */}
               <form onSubmit={handleAuth} className="space-y-3">
                 
                 {/* SIGN UP FIELDS */}
                 {authMode === 'signup' && (
                    <>
                        <div>
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <input 
                                type="tel" 
                                placeholder="Phone Number" 
                                className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </>
                 )}

                 {/* COMMON FIELDS */}
                 <div>
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                 </div>

                 {authMode !== 'forgot' && (
                     <div>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            className="w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                     </div>
                 )}

                 <button className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-slate-800 transition capitalize">
                    {authMode === 'login' ? 'Login Securely' : authMode === 'signup' ? 'Register Now' : 'Send Reset Link'}
                 </button>
               </form>

               {/* TOGGLES */}
               <div className="mt-6 text-center text-xs space-y-2">
                 {authMode === 'login' && (
                   <>
                     <p><button onClick={() => setAuthMode('forgot')} className="text-slate-400 hover:text-slate-600">Forgot Password?</button></p>
                     <p className="mt-2 text-slate-600">No account yet? <button onClick={() => setAuthMode('signup')} className="text-teal-600 font-bold hover:underline">Create Account</button></p>
                   </>
                 )}
                 {authMode === 'signup' && (
                    <p className="text-slate-600">Already have an account? <button onClick={() => setAuthMode('login')} className="text-teal-600 font-bold hover:underline">Login Here</button></p>
                 )}
                 {authMode === 'forgot' && (
                    <p><button onClick={() => setAuthMode('login')} className="text-teal-600 font-bold hover:underline">Back to Login</button></p>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}