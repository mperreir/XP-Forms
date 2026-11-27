import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './App.css';
import Accueil from "./pages/accueil/accueil";
import FormEditor2 from "./pages/form_editor/form_editor";
import FormViewer from "./pages/form_viewer/form_viewer";
import FormResponsesList from "./pages/FormResponsesList/FormResponsesList";
import Merci from "./pages/merci/Merci";

// Composant racine : fournit les traductions (i18n) et déclare toutes les routes de l'application
function App() {
  return (
    // Rend la traduction disponible dans toute l'application
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <Routes>
          {/* Page d'accueil : accessible à la racine "/" et via "/accueil" */}
          <Route index element={<Accueil />}></Route>
          <Route path="/accueil" element={<Accueil />}></Route>

          {/* Éditeur de formulaire : sans id = création, avec id = modification */}
          <Route path="/form-editor2" element={<FormEditor2 />} />
          <Route path="/form-editor2/:id" element={<FormEditor2 />} />

          {/* Affichage d'un formulaire, trois variantes d'URL :
              - /form-viewer/id/page : mode admin, sans participant
              - /form-viewer/id/page/id_participant : avec participant
              - /form-viewer/id/page/plage/id_participant : avec participant et plage de pages (ex. 2-4) */}
          <Route path="/form-viewer/:id/:page" element={<FormViewer />} />
          <Route path="/form-viewer/:id/:page/:id_participant" element={<FormViewer />} />
          <Route path="/form-viewer/:id/:page/:range/:id_participant" element={<FormViewer />} />

          {/* Liste des réponses d'un formulaire */}
          <Route path="/form-responses/:id" element={<FormResponsesList />} />

          {/* Page de remerciement affichée après l'envoi d'un formulaire */}
          <Route path="/merci" element={<Merci />} />
        </Routes>
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;