"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../../components/Navbar';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function StudentTickets() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMsg, setChatMsg] = useState('');

  // 1. Auth & Load Tickets
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => {
      setUser(u);
      if(u) {
        const q = query(collection(db, "tickets"), where("studentId", "==", u.uid));
        onSnapshot(q, (snap) => {
          setTickets(snap.docs.map(d => ({...d.data(), id: d.id})));
          // Update active ticket status in real-time if it changes
          if(activeTicket) {
             const updated = snap.docs.find(d => d.id === activeTicket.id);
             if(updated) setActiveTicket({...updated.data(), id: updated.id});
          }
        });
      }
    });
    return () => unsubAuth();
  }, [activeTicket?.id]); // Add dependency to refresh active ticket

  // 2. Load Chat for Selected Ticket
  useEffect(() => {
    if(!activeTicket) return;
    const q = query(collection(db, "tickets", activeTicket.id, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, snap => setMessages(snap.docs.map(d => d.data())));
    return () => unsub();
  }, [activeTicket]);

  const createTicket = async () => {
    if(!newTicket) return;
    await addDoc(collection(db, "tickets"), {
      studentId: user.uid, studentEmail: user.email, subject: newTicket,
      status: 'Open', createdAt: new Date().toISOString()
    });
    setNewTicket('');
  };

  const sendMessage = async () => {
    if(!chatMsg) return;
    await addDoc(collection(db, "tickets", activeTicket.id, "messages"), {
      text: chatMsg, sender: 'student', createdAt: new Date().toISOString()
    });
    setChatMsg('');
  };

  // NEW: CLOSE TICKET FUNCTION
  const closeTicket = async () => {
    if(confirm("Are you sure you want to close this ticket?")) {
      await updateDoc(doc(db, "tickets", activeTicket.id), { status: 'Closed' });
    }
  };

  if(!user) return <div className="p-10 text-center">Please Log In</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        
        {/* LEFT: Ticket List */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded shadow border border-slate-200">
            <h2 className="font-bold mb-2">Create New Ticket</h2>
            <input className="w-full border p-2 rounded text-sm mb-2" placeholder="Subject (e.g., Video Issue)" value={newTicket} onChange={e => setNewTicket(e.target.value)}/>
            <button onClick={createTicket} className="w-full bg-teal-600 text-white text-sm py-2 rounded font-bold hover:bg-teal-700">Raise Ticket</button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {tickets.map(t => (
              <div key={t.id} onClick={() => setActiveTicket(t)} className={`p-3 rounded border cursor-pointer hover:bg-slate-50 ${activeTicket?.id === t.id ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white'}`}>
                <div className="flex justify-between items-start">
                    <p className="font-bold text-sm truncate">{t.subject}</p>
                    {t.status === 'Closed' ? <FaCheckCircle className="text-slate-400"/> : <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block ${t.status==='Open'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Chat Window */}
        <div className="md:col-span-2 bg-white rounded shadow border border-slate-200 h-[600px] flex flex-col overflow-hidden">
          {activeTicket ? (
            <>
              {/* Header with Close Button */}
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">{activeTicket.subject}</h3>
                    <p className="text-xs text-slate-500">Ticket ID: #{activeTicket.id.slice(0,6)}</p>
                  </div>
                  {activeTicket.status === 'Open' && (
                    <button onClick={closeTicket} className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-200 transition">
                        <FaTimesCircle /> Close Ticket
                    </button>
                  )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${m.sender === 'student' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white text-slate-800 border rounded-bl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {activeTicket.status === 'Closed' && (
                    <div className="text-center py-4">
                        <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-bold">Ticket Closed</span>
                    </div>
                )}
              </div>

              {/* Input Area (Hidden if Closed) */}
              {activeTicket.status === 'Open' ? (
                <div className="p-3 border-t bg-white flex gap-2">
                    <input className="flex-1 border border-slate-300 p-2 rounded focus:outline-none focus:border-teal-500" placeholder="Type your message..." value={chatMsg} onChange={e => setChatMsg(e.target.value)} />
                    <button onClick={sendMessage} className="bg-slate-900 hover:bg-slate-800 text-white px-6 rounded font-bold transition">Send</button>
                </div>
              ) : (
                <div className="p-4 border-t bg-slate-100 text-center text-slate-500 text-sm italic">
                    This ticket has been marked as resolved.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>Select a ticket to view conversation</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}