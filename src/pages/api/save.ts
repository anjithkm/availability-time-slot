import { NextApiRequest, NextApiResponse } from 'next';

import redis from '@/lib/redis';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'POST') {
    const { user_id, data } = req.body;

    console.log("user_id bakend",user_id)
    console.log("data backend",data)

    try {
      await redis.set(user_id, JSON.stringify(data));
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    } 

  } else {
    res.status(405).end(); // Method Not Allowed
  }
}

