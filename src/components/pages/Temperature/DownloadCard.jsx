import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { exportRangeToExcel, exportRangeToPdf } from "../../../utils/export";
import SwitchButton from "../Temperature/SwitchButton";

const DownloadCard = ({
  isSingleDate,
  setIsSingleDate,
  selectedStartDate,
  selectedSingleDate,
  setSelectedStartDate,
  setSelectedSingleDate,
  setSelectedEndDate,
  selectedEndDate,
  archivedTemperatures,
  tempsToDisplay,
}) => {
  // Récupère toutes les dates uniques en ISO (YYYY-MM-DD)
  const getSortedIsoDates = (order = "asc") => {
    const dates = Array.from(new Set(archivedTemperatures.map((item) => item.isoDate)));
    return dates.sort((a, b) =>
      order === "asc"
        ? new Date(a + "T00:00:00") - new Date(b + "T00:00:00")
        : new Date(b + "T00:00:00") - new Date(a + "T00:00:00")
    );
  };

  const isoDatesAsc = getSortedIsoDates("asc");
  const isoDatesDesc = getSortedIsoDates("desc");

  // Convertit une valeur en format "YYYY-MM-DD" utilisable par un input type="date"
  const toInputDate = (value) => {
    if (!value) return "";
    const d = new Date(value + "T00:00:00"); // ⚡ Prend minuit local
    return isNaN(d) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Gestion du changement de date de début : si > date de fin, on ajuste
  const handleStartChange = (value) => {
    setSelectedStartDate(value);
    if (selectedEndDate && new Date(value + "T00:00:00") > new Date(selectedEndDate + "T23:59:59")) {
      setSelectedEndDate(value);
    }
  };

  return (
    <div className="card-download custom-card">
      <div className="custom-card-header blue">Télécharger les données</div>
      <div className="custom-card-body download-body">
        <SwitchButton
          isSingleDate={isSingleDate}
          setIsSingleDate={setIsSingleDate}
          selectedStartDate={selectedStartDate}
          selectedSingleDate={selectedSingleDate}
          setSelectedStartDate={setSelectedStartDate}
          setSelectedSingleDate={setSelectedSingleDate}
          setSelectedEndDate={setSelectedEndDate}
        />

        {!isSingleDate ? (
          <div className="date-range-container">
            <div className="select-date">
              <div className="date-input-group">
                <label htmlFor="start-date">Date de début</label>
                <input
                  id="start-date"
                  type="date"
                  value={toInputDate(selectedStartDate)}
                  min={isoDatesAsc[0] || ""}
                  max={isoDatesDesc[0] || ""}
                  onChange={(e) => handleStartChange(e.target.value)}
                />
              </div>

              <div className="date-input-group">
                <label htmlFor="end-date">Date de fin</label>
                <input
                  id="end-date"
                  type="date"
                  value={toInputDate(selectedEndDate)}
                  min={isoDatesAsc[0] || ""}
                  max={isoDatesDesc[0] || ""}
                  onChange={(e) => setSelectedEndDate?.(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="select-date">
            <div className="date-input-group">
              <label>Sélectionnez une date :</label>
              <select
                value={selectedSingleDate}
                onChange={(e) => setSelectedSingleDate(e.target.value)}
              >
                {isoDatesDesc.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="download-buttons">
          <button
            className="custom-btn green"
            onClick={() =>
              isSingleDate
                ? exportRangeToExcel(selectedSingleDate, selectedSingleDate, tempsToDisplay)
                : exportRangeToExcel(selectedStartDate, selectedEndDate, tempsToDisplay)
            }
            disabled={isSingleDate ? !selectedSingleDate : !selectedStartDate || !selectedEndDate}
          >
            <FaFileExcel /> Exporter Excel
          </button>

          <button
            className="custom-btn red"
            onClick={() =>
              isSingleDate
                ? exportRangeToPdf(selectedSingleDate, selectedSingleDate, tempsToDisplay)
                : exportRangeToPdf(selectedStartDate, selectedEndDate, tempsToDisplay)
            }
            disabled={isSingleDate ? !selectedSingleDate : !selectedStartDate || !selectedEndDate}
          >
            <FaFilePdf /> Exporter PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadCard;
