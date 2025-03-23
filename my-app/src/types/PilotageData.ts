// Arrival: pilot boarding ground -> anchorage
// Departure: From anchorage to pilot boarding ground
export interface PilotageData {
    pilotage_nm: string,
    pilotage_imo: string,
    pilotage_cst_dt_time: string, // when the pilotage service is requested by the vessel
    pilotage_end_dt_time: string | null, // when the pilotage service end
    pilotage_loc_to_code: string, // where the vessel is going
    pilotage_snapshot_dt: string, // shows when this snapshot of the vessel's pilotage service status was taken
    pilotage_loc_from_code: string, // where the vssel is coming from
    pilotage_start_dt_time: string | null, // when the pilotage service start
    pilotage_arrival_dt_time: string | null, // when vessels arrives at the pilot boarding location
    pilotage_onboard_dt_time: string | null, // when the pilot got on board
}   