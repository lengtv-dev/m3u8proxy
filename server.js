const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); // อนุญาตให้ Frontend (React) ดึงข้อมูลได้

// 1. Endpoint สำหรับ Rewrite Playlist
app.get('/playlist/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        
        // ในหน้างานจริง: ดึงข้อมูลจาก PostgreSQL (เช่น pool.query('SELECT source_url FROM channels...'))
        const originalUrl = "https://test-streams.mux.dev"; 
        
        const response = await axios.get(originalUrl);
        const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf("/") + 1);
        
        // Rewrite ทุกบรรทัดที่ไม่ใช่ # (Comment)
        const rewritten = response.data.replace(/^(?!#)(.*)$/gm, (line) => {
            if (!line.trim()) return line;
            const absoluteUrl = line.startsWith('http') ? line : baseUrl + line;
            // ส่งกลับมาที่ endpoint /proxy-segment ของเราเอง
            return `http://localhost:5000/proxy-segment?url=${encodeURIComponent(absoluteUrl)}`;
        });

        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(rewritten);
    } catch (error) {
        res.status(500).send("Error generating playlist");
    }
});

// 2. Endpoint สำหรับ Proxy ไฟล์ Segment (.ts)
app.get('/proxy-segment', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://olympic-embed.ais-vidnt.com' // ใส่ Header ตามที่ต้นทางต้องการ
            }
        });

        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res); // ส่งข้อมูลแบบ Stream ประหยัด RAM
    } catch (error) {
        res.status(500).send("Error fetching segment");
    }
});

app.listen(5000, () => console.log('Backend Proxy running on port 5000'));
