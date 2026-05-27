import React, { useEffect, useState } from 'react';
import QuartieriChart from './QuartieriChart';

const MAX_POSTI = {
  'Mompiano': 700,
  'Ospedale Civile': 350,
  'Borgo Trento': 500,
  'Centro Storico': 750,
  'Brescia Due': 1000,
  'Poliambulanza': 500,
  'San Polo': 800
};
const QUARTIERI = Object.keys(MAX_POSTI);

function Dashboard_admin() {
  const [posti, setPosti] = useState({});
  const [loading, setLoading] = useState(true);
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [loadingPrenotazioni, setLoadingPrenotazioni] = useState(true);
  const [deleteMsg, setDeleteMsg] = useState("");

  const CO2_PER_PRENOTAZIONE = 0.3;
  const co2Risparmiata = (prenotazioni.length * CO2_PER_PRENOTAZIONE).toFixed(1);

  useEffect(() => {
    async function fetchPosti() {
      setLoading(true);
      const PocketBase = (await import('pocketbase')).default;
      const pb = new PocketBase('http://127.0.0.1:8090');
      const nowISO = new Date().toISOString();
      let counts = {};
      for (const quartiere of QUARTIERI) {
        const tutte = await pb.collection('prenotazioni').getFullList({
          filter: `luogo = '${quartiere}'`
        });
        // Filtro lato client le prenotazioni attive
        const attive = tutte.filter(p => {
          const inizio = new Date(p.data_inizio);
          const fine = new Date(p.data_fine);
          const now = new Date(nowISO);
          return inizio <= now && fine > now;
        });
        counts[quartiere] = attive.length;
      }
      setPosti(counts);
      setLoading(false);
    }
    async function fetchPrenotazioni() {
      setLoadingPrenotazioni(true);
      const PocketBase = (await import('pocketbase')).default;
      const pb = new PocketBase('http://127.0.0.1:8090');
      const tutte = await pb.collection('prenotazioni').getFullList({
        sort: '-created',
        expand: 'user',
      });
      setPrenotazioni(tutte);
      setLoadingPrenotazioni(false);
    }
    fetchPosti();
    fetchPrenotazioni();
  }, []);

  async function eliminaPrenotazione(id) {
    setDeleteMsg("");
    try {
      const PocketBase = (await import('pocketbase')).default;
      const pb = new PocketBase('http://127.0.0.1:8090');
      await pb.collection('prenotazioni').delete(id);
      setPrenotazioni(prenotazioni => prenotazioni.filter(p => p.id !== id));
      setDeleteMsg("Prenotazione eliminata con successo");
      // Aggiorna anche i posti occupati dopo l'eliminazione
      aggiornaPosti();
    } catch (error) {
      setDeleteMsg("Errore nell'eliminazione della prenotazione");
    }
  }

  // Funzione per aggiornare i posti occupati (estratta da useEffect)
  async function aggiornaPosti() {
    setLoading(true);
    const PocketBase = (await import('pocketbase')).default;
    const pb = new PocketBase('http://127.0.0.1:8090');
    const nowISO = new Date().toISOString();
    let counts = {};
    for (const quartiere of QUARTIERI) {
      const tutte = await pb.collection('prenotazioni').getFullList({
        filter: `luogo = '${quartiere}'`
      });
      const attive = tutte.filter(p => {
        const inizio = new Date(p.data_inizio);
        const fine = new Date(p.data_fine);
        const now = new Date(nowISO);
        return inizio <= now && fine > now;
      });
      counts[quartiere] = attive.length;
    }
    setPosti(counts);
    setLoading(false);
  }

  return (
    <div>
      <h1>Dashboard Admin</h1>
      <p>Benvenuto nella dashboard admin!</p>
      <div style={{maxWidth: 800, margin: '0 auto 2rem auto', background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: 24, color: '#1b5e20', border: '1px solid #a5d6a7', textAlign: 'center'}}>
        <h2 style={{margin: 0, display: 'inline-flex', alignItems: 'center', gap: 10}}>🍃 CO₂ risparmiata</h2>
        <p style={{margin: '0.75rem 0 0', fontSize: 20, fontWeight: 600}}>{co2Risparmiata} kg</p>
        <p style={{margin: '0.25rem 0 0', fontSize: 15}}>Risparmio calcolato come 0,3 kg di CO₂ per ogni prenotazione</p>
      </div>
      <h2>Situazione posti occupati per quartiere</h2>
      <div style={{maxWidth: 800, margin: '0 auto 2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0002', padding: 24}}>
        <QuartieriChart dati={posti} maxPosti={MAX_POSTI} />
      </div>
      <h2 style={{marginTop: 32}}>Tutte le prenotazioni</h2>
      <div style={{maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0002', padding: 24, height: 350, overflowY: 'auto'}}>
        {loadingPrenotazioni ? (
          <p>Caricamento prenotazioni...</p>
        ) : (
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 15}}>
            <thead>
              <tr style={{background: '#f5f5f5'}}>
                <th style={{padding: 8, border: '1px solid #ddd'}}>ID</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Email</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Targa</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Luogo</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Inizio</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Fine</th>
                <th style={{padding: 8, border: '1px solid #ddd'}}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {prenotazioni.map(p => (
                <tr key={p.id}>
                  <td style={{padding: 8, border: '1px solid #ddd'}}>{p.id}</td>
                  <td style={{padding: 8, border: '1px solid #ddd'}}>{p.email}</td>
                  <td style={{padding: 8, border: '1px solid #ddd'}}>{p.targa}</td>
                  <td style={{padding: 8, border: '1px solid #ddd'}}>{p.luogo}</td>
                  <td style={{padding: 8, border: '1px solid #ddd'}}>{new Date(p.data_inizio).toLocaleString()}</td>
                  <td style={{padding: 8, border: '1px solid #ddd'}}>{new Date(p.data_fine).toLocaleString()}</td>
                  <td style={{padding: 8, border: '1px solid #ddd'}}>
                    <button onClick={() => eliminaPrenotazione(p.id)} style={{background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer'}}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {deleteMsg && <div style={{marginTop: 12, color: deleteMsg.includes('successo') ? 'green' : 'red'}}>{deleteMsg}</div>}
      </div>
      {loading && <p>Caricamento dati...</p>}
    </div>
  );
}

export default Dashboard_admin;