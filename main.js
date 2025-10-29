import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

  // Replace with your Supabase project settings
  const SUPABASE_URL = "https://ajokpxagznbqyczrruhq.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqb2tweGFnem5icXljenJydWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDY1MzcsImV4cCI6MjA3NDI4MjUzN30.l89lqejvhjDILilsFzmItC8_6PqyFQ9lRZwTr78YHnA"; // keep secret keys safe!
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Init map
// Define wide Europe bounds (for panning limit)
const europeBounds = L.latLngBounds(
  L.latLng(30, -25),  // Southwest – includes Spain and a bit of North Africa
  L.latLng(72, 60)    // Northeast – includes Scandinavia
);

// Initialize map
const map = L.map('map', {
  center: [47, 19],          // 👈 Central Europe (Hungary area)
  zoom: 6,                   // 👈 initial focus
  minZoom: 4,                // can zoom out a fair bit
  maxZoom: 18,               // limit zoom-in depth
  maxBounds: europeBounds,   // restrict extreme panning
  maxBoundsViscosity: 0.8,   // soft “bounce” at edges
  zoomSnap: 0.25,
  zoomDelta: 0.5
});

// Optional: ensure the map fits bounds at first
map.fitBounds([
  [34, -5],   // Southwest – Greece/Italy edge
  [56, 35]    // Northeast – Baltics edge (no Scandinavia)
]);
map.setZoom(6); // 👈 keeps your preferred initial zoom level



L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// --- Fix for popup offset on first click ---
map.on('popupopen', (e) => {
  // Force Leaflet to recalc popup position after rendering
  setTimeout(() => {
    e.popup.update();
  }, 0);
});


const greenIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path fill="#9AAA7A" d="M15 0C7 0 0 7 0 15c0 10 15 25 15 25s15-15 15-25C30 7 23 0 15 0z"/>
      <circle cx="15" cy="15" r="5" fill="#fff" />
    </svg>
  `),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40]
});


// Hover version (a bit brighter green)
const greenIconHover = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path fill="#AFC58B" d="M15 0C7 0 0 7 0 15c0 10 15 25 15 25s15-15 15-25C30 7 23 0 15 0z"/>
      <circle cx="15" cy="15" r="5" fill="#fff" />
    </svg>
  `),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40]
});

// Active (clicked) version (bit brighter green)
const greenIconActive = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path fill="#AFC58B" d="M15 0C7 0 0 7 0 15c0 10 15 25 15 25s15-15 15-25C30 7 23 0 15 0z"/>
      <circle cx="15" cy="15" r="5" fill="#fff" />
    </svg>
  `),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40]
});

// Peach temporary marker (#D9A293)
const peachIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path fill="#D9A293" d="M15 0C7 0 0 7 0 15c0 10 15 25 15 25s15-15 15-25C30 7 23 0 15 0z"/>
      <circle cx="15" cy="15" r="5" fill="#fff" />
    </svg>
  `),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40]
});



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
     // Get nickname/title and capitalize the first letter
      let name = p.title || p.nickname || "Anonymous";
      name = name.charAt(0).toUpperCase() + name.slice(1);

      let popupContent = `<h3>As told by <b>${name}</b></h3>${p.description || p.story}`;

      if (p.image_url) {
        popupContent += `<br><br><img src="${p.image_url}" style="margin-top:5px;">`;
      }
      // const newLocal = L.marker([p.lat, p.lng]).addTo(map).bindPopup(popupContent);
const marker = L.marker([p.lat, p.lng], { icon: greenIcon }).addTo(map);
marker.bindPopup(popupContent);

// Change icon color on hover
marker.on('mouseover', () => marker.setIcon(greenIconHover));
marker.on('mouseout', () => marker.setIcon(greenIcon));

// Change icon color on click (active)
marker.on('click', () => marker.setIcon(greenIconActive));
marker.on('popupclose', () => marker.setIcon(greenIcon));

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
  lastMarker = L.marker([lat, lng], { icon: peachIcon })
    .addTo(map)
    // .bindPopup("Selected location")
    // .openPopup();
});
  // Handle form submission
document.getElementById("pinForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const nickname = document.getElementById("nickname").value || "Anonymous";
  const story = document.getElementById("story").value;
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);
  const imageFile = document.getElementById("image").files[0];
  const email = document.getElementById("email").value || null;


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
      image_url,
      email
    }
  ]);

  if (error) {
    console.error("DB insert error:", error.message);
    alert("Error saving pin: " + error.message);
  }

  // Show pin immediately (local only)
// Remove the temporary peach marker
if (lastMarker) {
  map.removeLayer(lastMarker);
  lastMarker = null;
}

// Show the new "local" pin immediately
// Show the new "local" pin immediately (local feedback)
let popupContent = `<b>${nickname}</b><br>${story}`;
if (image_url) {
  popupContent += `<br><img src="${image_url}" style="max-width:150px; margin-top:5px;">`;
}

L.marker([lat, lng], { icon: greenIcon })
  .addTo(map)
  .bindPopup(popupContent)
  .openPopup();

// Reset form fields
e.target.reset();

// Collapse the form box
formBox.classList.add("collapsed");
const arrow = toggle.querySelector(".arrow");
arrow.innerHTML = "&#x25B2;"; // restore up arrow when closed

// Show temporary confirmation box
const box = document.getElementById("confirmationBox");
box.innerHTML = `
  ✅ Thank you for sharing your story!<br>
  It’s now pending admin review and will appear soon after approval.
`;
box.classList.remove("hidden");


// Hide message after 5 seconds
setTimeout(() => box.classList.add("hidden"), 5000);


});


  // Load on page start
  loadPins();
  


  // Collapsible contact zone form
const formBox = document.getElementById('contactZoneForm');
const toggle = formBox.querySelector('.form-toggle');
const form = document.getElementById('pinForm');
const sendBtn = form.querySelector('.send-btn');
const approvalBox = document.getElementById('approval');

// Toggle collapse/expand
toggle.addEventListener('click', () => {
  formBox.classList.toggle('collapsed');
  const arrow = toggle.querySelector('.arrow');
  arrow.innerHTML = formBox.classList.contains('collapsed') ? '&#x25B2;' : '&#x25BC;';
});

// Enable SEND button only when checkbox checked
approvalBox.addEventListener('change', () => {
  sendBtn.disabled = !approvalBox.checked;
});


// --- About panel toggle ---
const aboutPanel = document.getElementById('aboutPanel');
const aboutButton = aboutPanel.querySelector('.about-toggle');
const aboutContent = aboutPanel.querySelector('.about-content');
const closeIcon = aboutPanel.querySelector('.close-icon');

// Open panel when clicking the hamburger icon
aboutButton.addEventListener('click', () => {
  aboutPanel.classList.remove('collapsed');
  aboutButton.style.display = 'none';
});

// Close panel only when clicking the × icon
closeIcon.addEventListener('click', (e) => {
  e.stopPropagation(); // prevent bubbling
  aboutPanel.classList.add('collapsed');
  aboutButton.style.display = 'flex';
});


// how to contribute tav

// --- Tabs inside About panel ---
const aboutTabs = document.querySelectorAll('.about-tabs .tab');
const aboutTabContents = document.querySelectorAll('.tab-content');

aboutTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    aboutTabs.forEach(t => t.classList.remove('active'));
    aboutTabContents.forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    const target = tab.getAttribute('data-tab');
    document.querySelector(`.tab-content[data-tab="${target}"]`).classList.add('active');
  });
});

