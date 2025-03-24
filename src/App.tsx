import React, {useState} from "react";
import { getPilotageData } from "./services/api";
import SearchBar from "./components/SearchBar";
import PilotageTable from "./components/Table";
import { PilotageData } from "./types/PilotageData";
import "./App.css";

const App: React.FC = () => {
    const [pilotageData, setPilotageData] = useState<PilotageData[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (imo: string) => {
        try {
            const data = await getPilotageData(imo);
            console.log('App.tsx data is', data);
            setPilotageData(data);
            setError(null);
        } catch (error: any) {
            setError(error.message);
            setPilotageData([]);
        }
    };

    return (
        <div className="app-container">
            <h1>Vessel Status Checker</h1>
            <div className="search-container"></div>
            <SearchBar onSearch={handleSearch}/>
            {error && <p className="error-message">{error}</p>}
            {pilotageData.length > 0 ? (
                <PilotageTable data={pilotageData}/>
            ) : (
                !error && <p>No data to display. Enter a valid IMO to search.</p>
            )}
        </div>
    );
}

export default App;