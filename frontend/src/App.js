import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FormBuilder from "./components/FormBuilder";
import FormViewer from "./components/FormViewer";
import FormList from "./components/FormList";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FormBuilder />} />
        <Route path="/forms" element={<FormList />} />
        <Route path="/form/:formId" element={<FormViewer />} />
      </Routes>
    </Router>
  );
};

export default App;
