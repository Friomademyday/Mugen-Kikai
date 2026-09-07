import os from 'os';

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startCpus = os.cpus();
    setTimeout(() => {
      const endCpus = os.cpus();
      let totalDiff = 0;
      let idleDiff = 0;

      for (let i = 0; i < startCpus.length; i++) {
        const start = startCpus[i].times;
        const end = endCpus[i].times;

        const startTotal = start.user + start.nice + start.sys + start.idle + start.irq;
        const endTotal = end.user + end.nice + end.sys + end.idle + end.irq;

        totalDiff += endTotal - startTotal;
        idleDiff += end.idle - start.idle;
      }

      if (totalDiff === 0) return resolve(0);
      const usage = Math.max(0, Math.min(100, Math.round(((totalDiff - idleDiff) / totalDiff) * 100)));
      resolve(usage);
    }, 100);
  });
}

export function generateProgressBar(percent: number, length: number = 10): string {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return `[ ${'█'.repeat(filled)}${'░'.repeat(empty)} ]`;
}

export function getFormattedRuntime(): string {
  const uptimeSeconds = Math.floor(process.uptime());
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function getRamStats(): { usedGb: string; totalGb: string } {
  const mem = process.memoryUsage();
  const usedBytes = mem.rss;
  const totalBytes = os.totalmem();

  const usedGb = (usedBytes / (1024 * 1024 * 1024)).toFixed(1);
  const totalGb = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);

  return {
    usedGb: `${usedGb}GB`,
    totalGb: `${totalGb}GB`
  };
}

export async function getSystemMetrics() {
  const loadPercent = await getCpuUsage();
  const progressBar = generateProgressBar(loadPercent, 10);
  const runtime = getFormattedRuntime();
  const ram = getRamStats();

  return {
    loadPercent,
    progressBar,
    runtime,
    ramUsage: `${ram.usedGb} / ${ram.totalGb}`
  };
}
