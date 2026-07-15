const clientId = "5d0c21f1-d980-4e10-951a-427273095299";
const deviceCode = "ph1-W3Sb66_G0XxFldQmGd-Hv8n4p3F9Kucfgiw3mr4";
const tokenEndpoint = "https://mcp.motion.so/oauth/token";

async function poll() {
  while (true) {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: clientId,
        device_code: deviceCode
      })
    });
    
    const data = await res.json();
    
    if (data.error) {
      if (data.error === 'authorization_pending') {
        // Wait and poll again
        await new Promise(r => setTimeout(r, 5000));
      } else {
        console.error("Error during polling:", data);
        process.exit(1);
      }
    } else {
      console.log("Authorization successful!");
      console.log("Access Token:", data.access_token);
      
      // Save it to mcp.json or similar? For now just print.
      
      process.exit(0);
    }
  }
}

poll();
