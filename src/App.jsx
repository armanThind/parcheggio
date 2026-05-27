import { useEffect, useState } from 'react'
import './App.css'
import PocketBase from 'pocketbase';
import Dashboard from './dashboard.jsx';
import Dashboard_admin from './dashboard_admin.jsx';
function registerUser(registerform) {
  if (registerform.email.value === '' || registerform.password.value === '' || registerform.passwordConfirm.value === '') {
    return(alert('compila tutti i campi'))
  } else if (registerform.password.value !== registerform.passwordConfirm.value) {
    return(alert('le password non corrispondono'))
  } else{
    console.log("1")
         console.log("1")
      const pb = new PocketBase('http://127.0.0.1:8090');
      const data = {
          "email": registerform.email.value,
        "emailVisibility": true,
        "name": registerform.name.value,
        "password": registerform.password.value,
        "passwordConfirm": registerform.passwordConfirm.value,
         "admin": false
      };

    pb.collection('users').create(data)
      .then(record => {
        // gestisci il record creato
        console.log(record);
          alert('registrazione avvenuta con successo');
        //fa entrare nella paginaaaa
      })
      .catch(error => {
        // gestisci l'errore
        console.error(error);
      });
}}
function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  async function loginuser (loginForm){
    if(loginForm.email.value === '' || loginForm.password.value === ''){
      return(alert('compila tutti i campi'))
    }
    else {
      const pb = new PocketBase('http://127.0.0.1:8090');
      try {
        const dati = await pb.collection('users').authWithPassword(
          loginForm.email.value,
          loginForm.password.value
        );
        setUserEmail(dati.record.email);
        if (dati.record.admin==true) {
          setIsLogged('admin');
        } else {
          setIsLogged('user');
        }
      } catch (error) {
        console.error('Errore login:', error);
        alert('Email o password errati');
      }
    }
  }

  if (isLogged === 'admin') {
    return <Dashboard_admin userEmail={userEmail} />;
  }
  if (isLogged === 'user') {
    return <Dashboard userEmail={userEmail} />;
  }

  return (
    <div className="main-bg">
      {!showRegister && (
        <div className="login-container">
          <h2>Accedi</h2>
          <p>Inserisci email e password</p>
          <form id='loginForm' className="login-form" onSubmit={e => { e.preventDefault(); loginuser(e.target); }}>
            <input type="email" name="email" placeholder="Email" /><br />
            <input type="password" name="password" placeholder="Password" /><br />
            <button type="submit">Accedi</button>
          </form>
          <button id='btnRegister' className="add-btn" onClick={() => setShowRegister(true)}>
            Oppure se non hai un account registrati
          </button>
        </div>
      )}
      {showRegister && (
        <div className="login-container">
          <h2>Registrati</h2>
          <p>Inserisci email e password</p>
          <form id='registerForm' className="login-form" onSubmit={e => { e.preventDefault(); registerUser(e.target); }}>
            <input type="text" name="name" placeholder="Nome" /><br />
            <input type="email" name="email" placeholder="Email" /><br />
            <input type="password" name="password" placeholder="Password" /><br />
            <input type="password" name="passwordConfirm" placeholder="Conferma Password" /><br />
            <button type="submit">Registrati</button>
          </form>
          <button className="add-btn" onClick={() => setShowRegister(false)}>
            Torna al login
          </button>
        </div>
      )}
    </div>
  );
}

export default App