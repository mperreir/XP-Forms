
//Styles applicables aux composants de formulaire : map des clés connues + référence pour le panneau de styles
// Les clés "dynamic" prennent la valeur telle quelle
// Les clés non-dynamic ont une valeur fixe (toggle)

const STYLE_MAP = {
  bold:            { property: "font-weight", value: "bold" },
  italic:          { property: "font-style", value: "italic" },
  underline:       { property: "text-decoration", value: "underline" },
  color:           { property: "color", dynamic: true },
  fontSize:        { property: "font-size", dynamic: true },
  backgroundColor: { property: "background-color", dynamic: true },
  borderRadius:    { property: "border-radius", dynamic: true },
  padding:         { property: "padding", dynamic: true },
  margin:          { property: "margin", dynamic: true },
  border:          { property: "border", dynamic: true },
  opacity:         { property: "opacity", dynamic: true },
  textAlign:       { property: "text-align", dynamic: true },
  width:           { property: "width", dynamic: true },
};


// Référence pour le panneau de styles : clés connues + exemples
const STYLE_REFERENCE = [
  { key: "bold",            example: "true",      desc: "Texte en gras" },
  { key: "italic",          example: "true",      desc: "Texte en italique" },
  { key: "underline",       example: "true",      desc: "Texte souligné" },
  { key: "color",           example: "#e74c3c",   desc: "Couleur du texte" },
  { key: "fontSize",        example: "18px",      desc: "Taille de la police" },
  { key: "backgroundColor", example: "#fdf6e3",   desc: "Couleur de fond" },
  { key: "borderRadius",    example: "8px",       desc: "Arrondi des coins" },
  { key: "padding",         example: "8px 12px",  desc: "Espacement intérieur" },
  { key: "margin",          example: "0 0 16px 0",desc: "Espacement extérieur" },
  { key: "border",          example: "2px solid #ccc", desc: "Bordure" },
  { key: "opacity",         example: "0.7",       desc: "Transparence (0 à 1)" },
  { key: "textAlign",       example: "center",    desc: "Alignement du texte" },
  { key: "width",           example: "50%",       desc: "Largeur du composant" },
];


export { STYLE_MAP, STYLE_REFERENCE };