import React, { useState } from 'react';
import Mappa from './mappa.jsx';
import QrCode from './QrCode.jsx';
import './App.css';

function Dashboard({ userEmail }) {
  const [showMappa, setShowMappa] = useState(false);
  const [showTargaForm, setShowTargaForm] = useState(false);
  const [targa, setTarga] = useState("");
  const [msg, setMsg] = useState("");
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [loadingPrenotazioni, setLoadingPrenotazioni] = useState(true);

  // Carica le prenotazioni dell'utente
  const fetchPrenotazioni = React.useCallback(async () => {
    setLoadingPrenotazioni(true);
    const PocketBase = (await import('pocketbase')).default;
    const pb = new PocketBase('http://127.0.0.1:8090');
    const mie = await pb.collection('prenotazioni').getFullList({
      filter: `email = '${userEmail}'`,
      sort: '-created',
    });
    setPrenotazioni(mie);
    setLoadingPrenotazioni(false);
  }, [userEmail]);

  React.useEffect(() => {
    if (userEmail) fetchPrenotazioni();
  }, [userEmail, fetchPrenotazioni]);

  async function registraTarga(e) {
    e.preventDefault();
    setMsg("");
    if (!targa) {
      setMsg("Inserisci una targa valida");
      return;
    }
    try {
      // alert(userEmail)
      const PocketBase = (await import('pocketbase')).default;
      const pb = new PocketBase('http://127.0.0.1:8090');
      await pb.collection('targhe').create({
        mail_possessore: userEmail,
        targa: targa
      });
      setMsg("Targa registrata con successo!");
      setTarga("");
    } catch (error) {
      setMsg("Errore nella registrazione della targa");
      console.error(error);
    }
  }

  // Funzioni toggle
  const handleToggleMappa = () => {
    setShowMappa(v => !v);
  };
  const handleToggleTargaForm = () => {
    setShowTargaForm(v => !v);
    setMsg("");
  };

  return (
    <div className="dashboard-relative">
      <div className="dashboard-user-email">
        {userEmail}
      </div>
      <h1>Dashboard</h1>
      <p>Benvenuto nella dashboard!</p>
      <button className="add-btn" onClick={handleToggleMappa}>visualizza mappa</button>
      <button className="add-btn" onClick={handleToggleTargaForm}>Registra targa</button>
      {showMappa && <Mappa userEmail={userEmail} onNuovaPrenotazione={fetchPrenotazioni} />}
      {showTargaForm && (
        <div className="targa-form-container">
          <form onSubmit={registraTarga}>
            <label htmlFor="targa">Targa:</label><br />
            <input
              type="text"
              id="targa"
              value={targa}
              onChange={e => setTarga(e.target.value)}
              placeholder="Inserisci la targa"
              className="targa-input"
            /><br />
            <button type="submit" className="add-btn">Registra</button>
            <button type="button" className="add-btn targa-annulla-btn" onClick={() => { setShowTargaForm(false); setMsg(""); }}>Annulla</button>
          </form>
          {msg && <div className={msg.includes('successo') ? 'msg-success' : 'msg-error'}>{msg}</div>}
        </div>
      )}
      {/* Riepilogo prenotazioni utente */}
      <h2 style={{marginTop: 32}}>Le tue prenotazioni</h2>
      <div style={{maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0002', padding: 24, height: 350, overflowY: 'auto'}}>
        {loadingPrenotazioni ? (
          <p>Caricamento prenotazioni...</p>
        ) : prenotazioni.length === 0 ? (
          <p>Nessuna prenotazione trovata.</p>
        ) : (
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 15}}>
            <thead>
              <tr style={{background: '#f5f5f5'}}>
                <th style={{padding: 8, border: '1px solid #ddd'}}>ID</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Targa</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Luogo</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Inizio</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Fine</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Prezzo</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>QR Code</th>
              </tr>
            </thead>
            <tbody>
              {prenotazioni.map(p => {
                // Calcolo prezzo come in mappa.jsx
                const diffMs = new Date(p.data_fine) - new Date(p.data_inizio);
                const diffMin = diffMs / 60000;
                let prezzo = 0;
                if (diffMin > 30) {
                  prezzo = Math.ceil(diffMin / 60) * 2;
                }
                return (
                  <tr key={p.id}>
                    <td style={{padding: 8, border: '1px solid #ddd'}}>{p.id}</td>
                    <td style={{padding: 8, border: '1px solid #ddd'}}>{p.targa}</td>
                    <td style={{padding: 8, border: '1px solid #ddd'}}>{p.luogo}</td>
                    <td style={{padding: 8, border: '1px solid #ddd'}}>{new Date(p.data_inizio).toLocaleString()}</td>
                    <td style={{padding: 8, border: '1px solid #ddd'}}>{new Date(p.data_fine).toLocaleString()}</td>
                    <td style={{padding: 8, border: '1px solid #ddd'}}>{prezzo === 0 ? 'Gratuito' : prezzo + ' €'}</td>
                    <td style={{padding: 8, border: '1px solid #ddd'}}>
                      <QrCode value={p.id} size={64} downloadName={`prenotazione_${p.id}.svg`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;