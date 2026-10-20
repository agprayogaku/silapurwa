import readline from 'node:readline'
import { prosesPesanMasuk } from '../mesin/pipa.js'
import { getPengaturan } from '../db/kueri.js'

export async function jalankanSimulasi() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('==================================================================')
  console.log('  SIMULATOR CHATBOT SILAPURWA (LAPAS PURWAKARTA) - MODE LURING   ')
  console.log('  Ketik pertanyaan pengunjung untuk menguji respon bot secara lokal ')
  console.log('  Ketik "keluar" atau tekan Ctrl+C untuk mengakhiri              ')
  console.log('==================================================================\n')

  const delayMin = Number.parseInt(getPengaturan('delay_min_ms', '1500'), 10)
  const delayMax = Number.parseInt(getPengaturan('delay_max_ms', '4000'), 10)

  const promptUser = () => {
    rl.question('Pengunjung > ', async (input) => {
      const teks = input.trim()
      if (!teks) {
        promptUser()
        return
      }
      if (teks.toLowerCase() === 'keluar') {
        console.log('\nSimulasi diakhiri.')
        rl.close()
        process.exit(0)
      }

      // Simulasi jeda mengetik manusiawi
      const jeda = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
      process.stdout.write(`[Silapurwa sedang mengetik... (${(jeda / 1000).toFixed(1)} dtk)]\r`)

      await new Promise(r => setTimeout(r, jeda))

      const hasil = await prosesPesanMasuk({
        nomorWa: '628999888777',
        teks,
        kanal: 'simulasi'
      })

      console.log(`Silapurwa  > ${hasil.balasan}`)
      console.log(`[Metadata: jenis=${hasil.jenis} | skor=${hasil.skor} ${hasil.kode ? '| kode=' + hasil.kode : ''}]\n`)

      promptUser()
    })
  }

  promptUser()
}

if (process.argv[1] && process.argv[1].endsWith('simulasi.js')) {
  jalankanSimulasi()
}
