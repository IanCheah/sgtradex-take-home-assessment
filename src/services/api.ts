import axios from 'axios';
import { PilotageData } from '../types/PilotageData';

const BASE_URL = 'https://uat.engineering.sgtradex.net/api/v1/pilotage/'

export const getPilotageData = async (imo: string): Promise<PilotageData[]> => {
    try {
        const response = await axios.get(`${BASE_URL}${imo}`);
        console.log('response is', response.data);
        return response.data
    } catch (error) {
        throw new Error('There was an error retrieving the pilotage data. Check the imo you have entered!');
    }
}