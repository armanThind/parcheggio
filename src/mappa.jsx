import React, { useEffect, useState } from 'react';
// Importo il CSS di Leaflet in modo compatibile con Vite
import 'leaflet/dist/leaflet.css';
import QrCode from './QrCode.jsx';

// Limiti massimi per ogni quartiere
const MAX_POSTI = {
  'Mompiano': 700,
  'Ospedale Civile': 350,
  'Borgo Trento': 500,
  'Centro Storico': 750,
  'Brescia Due': 1000,
  'Poliambulanza': 500,
  'San Polo': 800
};

function Mappa({ userEmail, onNuovaPrenotazione }) {
  const [showPrenotazione, setShowPrenotazione] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [targheUtente, setTargheUtente] = useState([]);
  const [targaSelezionata, setTargaSelezionata] = useState('');
  const [luogo, setLuogo] = useState('');
  const [msg, setMsg] = useState('');
  const [inizio, setInizio] = useState('');
  const [fine, setFine] = useState('');
  const [datiPrenotazione, setDatiPrenotazione] = useState(null);

  // Lista aree per il menu a tendina
  const aree = [
    'Centro Storico',
    'San Polo',
    'Mompiano',
    'Brescia Due',
    'Poliambulanza',
    'Ospedale Civile',
    'Borgo Trento'
  ];

  useEffect(() => {
    import('leaflet').then(L => {
      // Evita di inizializzare più volte la mappa
      if (!document.getElementById('map')._leaflet_id) {
        // Coordinate Brescia centro
        const map = L.map('map').setView([45.5416, 10.2118], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        // Funzione per gestire click sui poligoni
        function onPolygonClick(area) {
          setSelectedArea(area);
          setLuogo(area);
          setShowPrenotazione(true);
          setMsg("");
          setInizio("");
          setFine("");
          // Carica targhe utente da PocketBase
          import('pocketbase').then(({ default: PocketBase }) => {
            const pb = new PocketBase('http://127.0.0.1:8090');
            pb.collection('targhe').getFullList({
              filter: `mail_possessore = '${userEmail}'`
            }).then(records => {
              setTargheUtente(records.map(r => r.targa));
              setTargaSelezionata(records.length > 0 ? records[0].targa : '');
              console.log("Targhe caricate:", records.map(r => r.targa));
            });
          });
        }
        // Centro Storico (allargato)
        L.polygon([
  [45.5455, 10.2145],
  [45.5458, 10.2320],
  [45.5365, 10.2355],
  [45.5315, 10.2285],
  [45.5320, 10.2175],
  [45.5390, 10.2125]
        ], { color: 'blue' }).addTo(map).bindPopup('Centro Storico').on('click', () => onPolygonClick('Centro Storico'));
        // San Polo (allargato)
        L.polygon([
  [45.5195, 10.2530],
  [45.5198, 10.2700],
  [45.5105, 10.2750],
  [45.5045, 10.2680],
  [45.5055, 10.2550],
  [45.5125, 10.2500]
        ], { color: 'green' }).addTo(map).bindPopup('San Polo').on('click', () => onPolygonClick('San Polo'));
        // Mompiano (allargato)
        L.polygon([
   [45.5755, 10.2310],
  [45.5758, 10.2435],
  [45.5685, 10.2475],
  [45.5615, 10.2410],
  [45.5620, 10.2325],
  [45.5695, 10.2290]

        ], { color: 'red' }).addTo(map).bindPopup('Mompiano').on('click', () => onPolygonClick('Mompiano'));
        // Brescia Due (allargato)
        L.polygon([
  [45.5305, 10.2140],
  [45.5308, 10.2285],
  [45.5235, 10.2315],
  [45.5195, 10.2255],
  [45.5200, 10.2155],
  [45.5255, 10.2125]
        ], { color: 'orange' }).addTo(map).bindPopup('Brescia Due').on('click', () => onPolygonClick('Brescia Due'));
        // Poliambulanza
        L.polygon([
  [45.5255, 10.2350],
  [45.5258, 10.2470],
  [45.5195, 10.2460],
  [45.5165, 10.2415],
  [45.5170, 10.2335],
  [45.5215, 10.2295]
        ], { color: 'purple' }).addTo(map).bindPopup('Poliambulanza').on('click', () => onPolygonClick('Poliambulanza'));
        // Ospedale Civile
        L.polygon([
  [45.5615, 10.2265],
  [45.5618, 10.2365],
  [45.5565, 10.2395],
  [45.5535, 10.2360],
  [45.5538, 10.2285],
  [45.5570, 10.2255]
        ], { color: 'brown' }).addTo(map).bindPopup('Ospedale Civile').on('click', () => onPolygonClick('Ospedale Civile'));
        // Borgo Trento
        L.polygon([
 [45.5585, 10.2110],
  [45.5588, 10.2230],
  [45.5535, 10.2260],
  [45.5505, 10.2215],
  [45.5510, 10.2135],
  [45.5550, 10.2105]
        ], { color: 'cyan' }).addTo(map).bindPopup('Borgo Trento').on('click', () => onPolygonClick('Borgo Trento'));
      }
    });
  }, [userEmail]);

  async function handlePrenota(e) {
    e.preventDefault();
    setMsg("");
    if (!targaSelezionata || !luogo || !inizio || !fine) {
      setMsg("Compila tutti i campi");
      return;
    }
    // Controllo che la data di fine sia dopo quella di inizio
    if (new Date(fine) <= new Date(inizio)) {
      setMsg("La data/ora di fine deve essere successiva a quella di inizio");
      return;
    }
    try {
      const PocketBase = (await import('pocketbase')).default;
      const pb = new PocketBase('http://127.0.0.1:8090');
      // Controllo posti disponibili per il quartiere selezionato
      const nowISO = new Date().toISOString();
      const attive = await pb.collection('prenotazioni').getFullList({
        filter: `luogo = '${luogo}' && data_fine > '${nowISO}'`
      });
      if (attive.length >= (MAX_POSTI[luogo] || 0)) {
        setMsg("Posti esauriti per questo quartiere!");
        return;
      }
      // Converto in formato ISO 8601 (compatibile con PocketBase date_time)
      const inizioISO = new Date(inizio).toISOString();
      const fineISO = new Date(fine).toISOString();
      const res = await pb.collection('prenotazioni').create({
        email: userEmail,
        targa: targaSelezionata,
        luogo: luogo,
        data_inizio: inizioISO,
        data_fine: fineISO
      });
      // Calcolo prezzo
      const diffMs = new Date(fine) - new Date(inizio);
      const diffMin = diffMs / 60000;
      let prezzo = 0;
      if (diffMin > 30) {
        prezzo = Math.ceil(diffMin / 60) * 2;
      }
      setDatiPrenotazione({ id: res.id, prezzo });
      setMsg("Prenotazione effettuata con successo!");
      setShowPrenotazione(false);
      if (onNuovaPrenotazione) onNuovaPrenotazione();
    } catch (error) {
      setMsg("Errore nella prenotazione");
      console.error(error);
    }
  }

  return (
    <div>
      <h2>Mappa</h2>
      <div id="map" className="mappa-leaflet"></div>
      {showPrenotazione && (
        <div className="prenotazione-modal">
          <h3>Prenotazione parcheggio</h3>
          <form onSubmit={handlePrenota}>
            <label>Targa:</label><br />
            <select value={targaSelezionata} onChange={e => setTargaSelezionata(e.target.value)} className="prenotazione-select">
              {targheUtente.length === 0 && <option value="">Nessuna targa</option>}
              {targheUtente.map(t => <option key={t} value={t}>{t}</option>)}
            </select><br />
            <label>Luogo:</label><br />
            <select value={luogo} onChange={e => setLuogo(e.target.value)} className="prenotazione-select">
              {aree.map(a => <option key={a} value={a}>{a}</option>)}
            </select><br />
            <label>Inizio prenotazione:</label><br />
            <input type="datetime-local" value={inizio} onChange={e => setInizio(e.target.value)} className="prenotazione-input" /><br />
            <label>Fine prenotazione:</label><br />
            <input type="datetime-local" value={fine} onChange={e => setFine(e.target.value)} className="prenotazione-input" /><br />
            <button type="submit" className="add-btn">Prenota</button>
            <button type="button" className="add-btn prenotazione-annulla-btn" onClick={() => setShowPrenotazione(false)}>Annulla</button>
          </form>
          {msg && <div className={msg.includes('successo') ? 'msg-success' : 'msg-error'}>{msg}</div>}
        </div>
      )}
      {datiPrenotazione && (
        <div className="prenotazione-confermata">
          <h3>Prenotazione confermata!</h3>
          <p><b>ID prenotazione:</b> {datiPrenotazione.id}</p>
          <p><b>QR Code:</b><br /><QrCode value={datiPrenotazione.id} size={96} /></p>
          <p><b>Prezzo:</b> {datiPrenotazione.prezzo === 0 ? 'Gratuito (meno di 30 minuti)' : datiPrenotazione.prezzo + ' €'}</p>
          <button className="add-btn" onClick={() => setDatiPrenotazione(null)}>Chiudi</button>
        </div>
      )}
    </div>
  );
}

export default Mappa;
