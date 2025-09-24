import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

  // Replace with your Supabase project settings
  const SUPABASE_URL = "https://ajokpxagznbqyczrruhq.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqb2tweGFnem5icXljenJydWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDY1MzcsImV4cCI6MjA3NDI4MjUzN30.l89lqejvhjDILilsFzmItC8_6PqyFQ9lRZwTr78YHnA"; // keep secret keys safe!
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Init map
const europeBounds = L.latLngBounds(
  L.latLng(30, -25),  // SW corner: includes southern Spain/North Africa edge
  L.latLng(70, 60)    // NE corner: Scandinavia/Russia border
);

// Center slightly south of Czechia (~48 N, 14 E) to focus on central-southern Europe
const map = L.map('map', {
  center: [48, 14],    // South-centered view
  zoom: 4.5,           // Slightly zoomed in
  maxBounds: europeBounds, // Restrict panning to Europe
  maxBoundsViscosity: 0.8  // Soft “bounce” at edges
});



// Minimalist normal-color map tiles (Carto Voyager Light)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);
  

  // Load pins
  async function loadPins(){
    const { data, error } = await supabase
      .from("pins")
      .select("*")
      .eq("status","approved");

    if (error) {
      console.error("Error loading pins:", error);
      return;
    }

    data.forEach(p=>{
      let popupContent = `<b>${p.title || p.nickname}</b><br>${p.description || p.story}`;
      if (p.image_url) {
        popupContent += `<br><img src="${p.image_url}" style="max-width:150px; margin-top:5px;">`;
      }
      L.marker([p.lat, p.lng]).addTo(map).bindPopup(popupContent);
    });
  }

  // Add pin on map click
// Add pin on map click
let lastMarker = null; // store the last clicked marker

map.on("click", (e) => {
  const { lat, lng } = e.latlng;

  // Update form inputs
  document.getElementById("lat").value = lat;
  document.getElementById("lng").value = lng;

  // Remove previous temporary marker
  if (lastMarker) {
    map.removeLayer(lastMarker);
  }

  // Add new temporary marker
  lastMarker = L.marker([lat, lng]).addTo(map).bindPopup("Selected location").openPopup();
});
  // Handle form submission
document.getElementById("pinForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const nickname = document.getElementById("nickname").value || "Anonymous";
  const story = document.getElementById("story").value;
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);
  const imageFile = document.getElementById("image").files[0];

  let image_url = null;

  // Upload image if exists
if (imageFile) {
  try {
    const fileName = `${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, imageFile);

    if (uploadError) {
      console.warn("Image upload failed:", uploadError.message);
    } else {
      // Correct way to get public URL
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);
      image_url = urlData.publicUrl;
      
      const { error: uploadError } = await supabase.storage
  .from("images")
  .upload(fileName, imageFile);

    }
  } catch (err) {
    console.error("Upload exception:", err);
  }
}

  // Insert into DB (even if image_url = null)
  const { error } = await supabase.from("pins").insert([
    { 
      title: nickname, 
      description: story, 
      lat, 
      lng, 
      status: "pending", 
      image_url 
    }
  ]);

  if (error) {
    console.error("DB insert error:", error.message);
    alert("Error saving pin: " + error.message);
  }

  // Show pin immediately (local only)
  let popupContent = `<b>${nickname}</b><br>${story}`;
  if (image_url) {
    popupContent += `<br><img src="${image_url}" style="max-width:150px; margin-top:5px;">`;
  }
  L.marker([lat, lng]).addTo(map).bindPopup(popupContent).openPopup();

  alert("Submitted! Your pin is visible to you now and will appear for everyone once approved.");
  e.target.reset();
});


  // Load on page start
  loadPins();