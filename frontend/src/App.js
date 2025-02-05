import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FormBuilder from "./components/FormBuilder";
import FormViewer from "./components/FormViewer";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FormBuilder />} />
        <Route path="/form/:formId" element={<FormViewer />} />
      </Routes>
    </Router>
  );
};

export default App;
