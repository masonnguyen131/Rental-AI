// Initialize Google Maps
//const fs = require('fs');
//const fetch = require('node-fetch'); // Install this package if not already installed

// Initialize the Google Map
let map;
let markers = []; // Keep track of markers to remove them later

function initMap() {
  const mapOptions = {
    center: { lat: 34.0522, lng: -118.2437 }, // Los Angeles coordinates
    zoom: 12,
  };

  map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

// Add markers to the map
function addMarkers(properties) {
  // Remove existing markers
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  // Add new markers
  properties.forEach(property => {
    const marker = new google.maps.Marker({
      position: { lat: property.latitude, lng: property.longitude },
      map: map,
      title: property.address,
    });

    // Add an info window
    const infoWindow = new google.maps.InfoWindow({
      content: `<div>
        <h4>${property.address}</h4>
        <p>Lat: ${property.latitude}, Lng: ${property.longitude}</p>
      </div>`,
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    markers.push(marker);
  });

  //center the map around the first marker
  if (properties.length > 0) {
    map.setCenter({ lat: properties[0].latitude, lng: properties[0].longitude });
  }
}

// Append bot response to the chat UI
function appendBotResponse(botReply) {
  console.log("reply to replace",botReply)
  const messagesContainer = document.getElementById('messages');
  const botMessage = document.createElement('div');
  botMessage.innerHTML = botReply.replace(/\n/g, '<br>'); // Converts newlines to HTML <br> tags
  botMessage.style.color = 'green'; // Optional: style the bot message
  messagesContainer.appendChild(botMessage);
}


// Chatbot Logic
document.getElementById('send-btn').addEventListener('click', async () => {
  const userInput = document.getElementById('user-input').value;
  if (!userInput) return;

  // Append user's message to the chat
  const messagesContainer = document.getElementById('messages');
  const userMessage = document.createElement('div');
  userMessage.textContent = `You: ${userInput}`;
  userMessage.style.color = 'blue'; // Optional: style the user's message
  messagesContainer.appendChild(userMessage);

  // Clear the input field
  document.getElementById('user-input').value = '';

  try {
    // Send the user's message to the backend
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userInput }),
    });

    const data = await response.json();
    const botReply = data.reply;
    const properties = data.properties
    console.log("data",data)
    // Use appendBotResponse to display the bot's reply
    appendBotResponse(botReply);
    console.log("properties",properties)
    // Add markers to map
    if (properties && properties.length > 0) {
      addMarkers(properties);
    }

    // Scroll to the bottom of the messages container
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error('Error fetching bot response:', error);
  }
});


window.onload = initMap;

function getHouses() {

  const url = 'https://api.rentcast.io/v1/listings/rental/long-term?city=Los%20Angeles&state=CA&status=Active&limit=150';
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', 'X-Api-Key': '936217d401fe43b8b7a98517552c3caf' }
  };

  fetch(url, options)
    .then(res => res.json())
    .then(json => {
      console.log(json); // Log the JSON for debugging
      saveJsonToFile(json, 'rental_listings.json'); // Save JSON to file
    })
    .catch(err => console.error(err));

}

// Function to save JSON data to a file in Node.js
function saveJsonToFile(data, filename) {
  // Convert JSON object to string
  const jsonString = JSON.stringify(data, null, 2);

  // Write JSON string to file
  fs.writeFile(filename, jsonString, (err) => {
    if (err) {
      console.error('Error saving JSON file:', err);
    } else {
      console.log(`JSON file saved as ${filename}`);
    }
  });
}
/*
module.exports = {
  getHouses,
  saveJsonToFile
}
*/