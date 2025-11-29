import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import React from "react";
import './App.css';
import Accueil from "./pages/accueil/accueil";
import FormEditor2 from "./pages/form_editor/form_editor";
import FormViewer from "./pages/form_viewer/form_viewer";
import FormResponsesList from "./pages/FormResponsesList/FormResponsesList";
import FolderViewer from "./pages/FolderViewer/FolderViewer";
import Merci from "./pages/merci/Merci";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route index element={<Accueil />}></Route>
          <Route path="/accueil" element={<Accueil />}></Route>
          <Route path="/form-editor2" element={<FormEditor2 />} />
          <Route path="/form-viewer/:id/:page" element={<FormViewer />} />
          <Route path="/form-viewer/:id/:page/:id_participant" element={<FormViewer />} />
          <Route path="/form-responses/:id" element={<FormResponsesList />} />
          <Route path="/form-editor2/:id" element={<FormEditor2 />} />
          <Route path="/folder/:id" element={<FolderViewer />} />
          <Route path="/merci" element={<Merci />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;