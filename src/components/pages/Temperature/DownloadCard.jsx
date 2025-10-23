import { useState, useMemo } from "react";
import { FaFileExcel, FaFilePdf, FaCalendarAlt, FaInfoCircle, FaClock, FaDownload } from "react-icons/fa";
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
  const [exportFormat, setExportFormat] = useState("excel"); // "excel" ou "pdf"
  const [showPreview, setShowPreview] = useState(false);

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

  // Statistiques sur les données à exporter
  const exportStats = useMemo(() => {
    if (!tempsToDisplay.length) return null;

    const uniqueSensors = new Set(tempsToDisplay.map(t => t.sensor_name)).size;
    const dataPoints = tempsToDisplay.length;
    const dateRange = isSingleDate 
      ? selectedSingleDate 
      : `${selectedStartDate} → ${selectedEndDate}`;
    
    // Calcul de la taille estimée
    const estimatedSizeKB = Math.round((dataPoints * 0.5) / 1024 * 1000) / 1000;

    return {
      sensors: uniqueSensors,
      dataPoints,
      dateRange,
      estimatedSize: estimatedSizeKB > 1000 
        ? `${(estimatedSizeKB / 1024).toFixed(2)} MB` 
        : `${estimatedSizeKB.toFixed(2)} KB`
    };
  }, [tempsToDisplay, isSingleDate, selectedSingleDate, selectedStartDate, selectedEndDate]);

  // Convertit une valeur en format "YYYY-MM-DD" utilisable par un input type="date"
  const toInputDate = (value) => {
    if (!value) return "";
    const d = new Date(value + "T00:00:00");
    return isNaN(d) 
      ? "" 
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Gestion du changement de date de début
  const handleStartChange = (value) => {
    setSelectedStartDate(value);
    if (selectedEndDate && new Date(value + "T00:00:00") > new Date(selectedEndDate + "T23:59:59")) {
      setSelectedEndDate(value);
    }
  };

  // Raccourcis de dates
  const applyDateShortcut = (shortcut) => {
    const today = new Date();
    let start, end;

    switch (shortcut) {
      case "today":
        start = end = toInputDate(today.toISOString().split('T')[0]);
        setIsSingleDate(true);
        setSelectedSingleDate(start);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = toInputDate(yesterday.toISOString().split('T')[0]);
        setIsSingleDate(true);
        setSelectedSingleDate(start);
        break;
      case "last7days":
        end = toInputDate(today.toISOString().split('T')[0]);
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        start = toInputDate(last7.toISOString().split('T')[0]);
        setIsSingleDate(false);
        setSelectedStartDate(start);
        setSelectedEndDate(end);
        break;
      case "last30days":
        end = toInputDate(today.toISOString().split('T')[0]);
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        start = toInputDate(last30.toISOString().split('T')[0]);
        setIsSingleDate(false);
        setSelectedStartDate(start);
        setSelectedEndDate(end);
        break;
      case "thisMonth":
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        start = toInputDate(firstDay.toISOString().split('T')[0]);
        end = toInputDate(today.toISOString().split('T')[0]);
        setIsSingleDate(false);
        setSelectedStartDate(start);
        setSelectedEndDate(end);
        break;
      default:
        break;
    }
  };

  // Export avec le format sélectionné
  const handleExport = () => {
    const startDate = isSingleDate ? selectedSingleDate : selectedStartDate;
    const endDate = isSingleDate ? selectedSingleDate : selectedEndDate;

    if (exportFormat === "excel") {
      exportRangeToExcel(startDate, endDate, tempsToDisplay);
    } else {
      exportRangeToPdf(startDate, endDate, tempsToDisplay);
    }
  };

  const isExportDisabled = isSingleDate 
    ? !selectedSingleDate 
    : !selectedStartDate || !selectedEndDate || tempsToDisplay.length === 0;

  return (
    <div className="custom-card card-download">
      <div className="custom-card-header" style={{ 
        background: 'linear-gradient(135deg, #346a4e 0%, #4a9077 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FaDownload /> Télécharger les données
      </div>
      
      <div className="custom-card-body download-body" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        padding: '20px'
      }}>
        
        {/* Mode de sélection */}
        <SwitchButton
          isSingleDate={isSingleDate}
          setIsSingleDate={setIsSingleDate}
          selectedStartDate={selectedStartDate}
          selectedSingleDate={selectedSingleDate}
          setSelectedStartDate={setSelectedStartDate}
          setSelectedSingleDate={setSelectedSingleDate}
          setSelectedEndDate={setSelectedEndDate}
        />

        {/* Raccourcis rapides */}
        <div style={{ 
          background: 'rgba(52, 106, 78, 0.04)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(52, 106, 78, 0.1)'
        }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: '500', 
            marginBottom: '8px',
            color: '#555',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FaClock size={12} /> Raccourcis rapides
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => applyDateShortcut('today')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#346a4e';
                e.target.style.color = '#fff';
                e.target.style.borderColor = '#346a4e';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#000';
                e.target.style.borderColor = '#ddd';
              }}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => applyDateShortcut('yesterday')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#346a4e';
                e.target.style.color = '#fff';
                e.target.style.borderColor = '#346a4e';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#000';
                e.target.style.borderColor = '#ddd';
              }}
            >
              Hier
            </button>
            <button
              onClick={() => applyDateShortcut('last7days')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#346a4e';
                e.target.style.color = '#fff';
                e.target.style.borderColor = '#346a4e';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#000';
                e.target.style.borderColor = '#ddd';
              }}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => applyDateShortcut('last30days')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#346a4e';
                e.target.style.color = '#fff';
                e.target.style.borderColor = '#346a4e';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#000';
                e.target.style.borderColor = '#ddd';
              }}
            >
              30 derniers jours
            </button>
            <button
              onClick={() => applyDateShortcut('thisMonth')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#346a4e';
                e.target.style.color = '#fff';
                e.target.style.borderColor = '#346a4e';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.color = '#000';
                e.target.style.borderColor = '#ddd';
              }}
            >
              Ce mois
            </button>
          </div>
        </div>

        {/* Sélection de dates */}
        {!isSingleDate ? (
          <div className="date-range-container">
            <div className="select-date" style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
              <div className="date-input-group">
                <label htmlFor="start-date" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  marginBottom: '6px'
                }}>
                   Date de début
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={toInputDate(selectedStartDate)}
                  min={isoDatesAsc[0] || ""}
                  max={isoDatesDesc[0] || ""}
                  onChange={(e) => handleStartChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="date-input-group">
                <label htmlFor="end-date" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontWeight: '500',
                  fontSize: '14px',
                  marginBottom: '6px'
                }}>
                 Date de fin
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={toInputDate(selectedEndDate)}
                  min={selectedStartDate || isoDatesAsc[0] || ""}
                  max={isoDatesDesc[0] || ""}
                  onChange={(e) => setSelectedEndDate?.(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="select-date">
            <div className="date-input-group">
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontWeight: '500',
                fontSize: '14px',
                marginBottom: '6px'
              }}>
                <FaCalendarAlt size={12} /> Sélectionnez une date
              </label>
              <select
                value={selectedSingleDate}
                onChange={(e) => setSelectedSingleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {isoDatesDesc.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Aperçu des données */}
        {exportStats && (
          <div style={{
            background: '#f8f9fa',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#555'
            }}>
              <FaInfoCircle /> Aperçu de l'export
            </div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>📅 Période :</span>
                <strong>{exportStats.dateRange}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>🌡️ Capteurs :</span>
                <strong>{exportStats.sensors}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>📊 Points de données :</span>
                <strong>{exportStats.dataPoints}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>💾 Taille estimée :</span>
                <strong>{exportStats.estimatedSize}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Sélection du format */}
        <div>
          <label style={{ 
            display: 'block',
            fontWeight: '500',
            fontSize: '14px',
            marginBottom: '8px',
            color: '#555'
          }}>
            Format d'export
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setExportFormat('excel')}
              style={{
                flex: 1,
                padding: '12px',
                border: exportFormat === 'excel' ? '2px solid #28a745' : '1px solid #ddd',
                borderRadius: '8px',
                background: exportFormat === 'excel' ? '#e8f5e9' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <FaFileExcel style={{ color: '#28a745', fontSize: '18px' }} />
              Excel
            </button>
            <button
              onClick={() => setExportFormat('pdf')}
              style={{
                flex: 1,
                padding: '12px',
                border: exportFormat === 'pdf' ? '2px solid #dc3545' : '1px solid #ddd',
                borderRadius: '8px',
                background: exportFormat === 'pdf' ? '#ffebee' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <FaFilePdf style={{ color: '#dc3545', fontSize: '18px' }} />
              PDF
            </button>
          </div>
        </div>

        {/* Bouton d'export principal */}
        <button
          className="custom-btn"
          onClick={handleExport}
          disabled={isExportDisabled}
          style={{
            width: '100%',
            padding: '14px',
            background: isExportDisabled 
              ? '#e9ecef' 
              : exportFormat === 'excel' 
                ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                : 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)',
            color: isExportDisabled ? '#adb5bd' : '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: isExportDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.3s',
            boxShadow: isExportDisabled ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseEnter={(e) => {
            if (!isExportDisabled) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isExportDisabled) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }
          }}
        >
          {exportFormat === 'excel' ? <FaFileExcel size={18} /> : <FaFilePdf size={18} />}
          {isExportDisabled 
            ? 'Sélectionnez une période' 
            : `Télécharger ${exportFormat === 'excel' ? 'Excel' : 'PDF'}`
          }
        </button>

        {/* Note d'information */}
        {!isExportDisabled && (
          <div style={{
            fontSize: '12px',
            color: '#6c757d',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            💡 Le fichier sera téléchargé automatiquement
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadCard