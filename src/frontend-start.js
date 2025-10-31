const { spawn } = require('child_process');

// Démarrage de React
const react = spawn('npm', ['start'], { stdio: 'inherit', shell: true });

react.on('close', (code) => {
  console.log(`Frontend exited with code ${code}`);
});
