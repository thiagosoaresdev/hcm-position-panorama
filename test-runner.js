const { spawn } = require('child_process');
const path = require('path');

const projectPath = path.join(__dirname, 'sistema-quadro-lotacao');

console.log('Running tests in:', projectPath);

const testProcess = spawn('npm', ['run', 'test'], {
  cwd: projectPath,
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  console.log(`Test process exited with code ${code}`);
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});