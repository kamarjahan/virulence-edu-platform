"use client";
import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { FaGoogle, FaUserGraduate, FaTimes, FaHeadset } from 'react-icons/fa';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setShowModal(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e) { setError(e.message); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      if (authMode === 'signup') await createUserWithEmailAndPassword(auth, email, password);
      else if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else if (authMode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMsg('Password reset link sent to your email!');
      }
    } catch (err) { setError(err.message.replace("Firebase:", "")); }
  };

  return (
    <>
      <nav className="bg-white/90 backdrop-blur border-b sticky top-0 z-50 h-16 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <Link href="/" className="font-bold text-xl tracking-tight text-slate-900">VIRULENCE <span className="text-teal-600">EDU</span></Link>
        
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="hidden md:block hover:text-teal-600">Home</Link>
          <Link href="/#courses" className="hidden md:block hover:text-teal-600">Courses</Link>
          
          {user && (
            <Link href="/tickets" className="flex items-center gap-1 text-teal-600 hover:text-teal-700">
              <FaHeadset /> Help Desk
            </Link>
          )}

          {user?.email === 'contact@kamarjahan.in' && (
            <Link href="/admin" className="text-red-600 border border-red-200 px-2 py-1 rounded text-xs font-bold uppercase">Admin Panel</Link>
          )}

          {user ? (
            <button onClick={() => signOut(auth)} className="text-slate-500 hover:text-red-500">Log Out</button>
          ) : (
            <button onClick={() => { setShowModal(true); setAuthMode('login'); }} className="bg-slate-900 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2">
              <FaUserGraduate /> Login
            </button>
          )}
        </div>
      </nav>

      {/* AUTH MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative overflow-hidden">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-slate-400"><FaTimes /></button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center mb-1">
                {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Join Virulence' : 'Reset Password'}
              </h2>
              <p className="text-center text-slate-500 text-xs mb-6">Online Learning Portal</p>

              {msg && <p className="bg-green-100 text-green-700 p-2 text-xs rounded mb-4 text-center">{msg}</p>}
              {error && <p className="bg-red-50 text-red-500 p-2 text-xs rounded mb-4 text-center">{error}</p>}

              {authMode !== 'forgot' && (
                <button onClick={handleGoogle} className="w-full border p-2 rounded flex justify-center items-center gap-2 text-sm font-bold text-slate-700 mb-4 hover:bg-slate-50">
                  <FaGoogle className="text-red-500" /> Google Login
                </button>
              )}

              <form onSubmit={handleAuth} className="space-y-3">
                <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm" />
                {authMode !== 'forgot' && (
                  <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded text-sm" />
                )}
                <button className="w-full bg-teal-600 text-white py-2 rounded font-bold text-sm hover:bg-teal-700">
                  {authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-4 text-center text-xs space-y-2">
                {authMode === 'login' && (
                  <>
                    <p><button onClick={() => setAuthMode('forgot')} className="text-slate-400 hover:text-slate-600">Forgot Password?</button></p>
                    <p>New here? <button onClick={() => setAuthMode('signup')} className="text-teal-600 font-bold">Create Account</button></p>
                  </>
                )}
                {authMode === 'signup' && <p>Have an account? <button onClick={() => setAuthMode('login')} className="text-teal-600 font-bold">Login</button></p>}
                {authMode === 'forgot' && <p><button onClick={() => setAuthMode('login')} className="text-teal-600 font-bold">Back to Login</button></p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}