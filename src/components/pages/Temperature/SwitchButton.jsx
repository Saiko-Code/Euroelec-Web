const SwitchButton = ({
  isSingleDate,
  setIsSingleDate,
  selectedStartDate,
  selectedSingleDate,
  setSelectedStartDate,
  setSelectedSingleDate,
  setSelectedEndDate
}) => {
  const handleSwitchChange = () => {
    const newIsSingleDate = !isSingleDate;
    setIsSingleDate(newIsSingleDate);
    if (newIsSingleDate) {
      setSelectedSingleDate(selectedStartDate);
    } else {
      setSelectedStartDate(selectedSingleDate);
      setSelectedEndDate(selectedSingleDate);
    }
  };

  return (
    <div className="switch-container">
      <span className={!isSingleDate ? "switch-text active" : "switch-text"}>Période</span>
      <label className="switch">
        <input type="checkbox" checked={isSingleDate} onChange={handleSwitchChange} />
        <span className="slider round"></span>
      </label>
      <span className={isSingleDate ? "switch-text active" : "switch-text"}>Un seul jour</span>
    </div>
  );
};

export default SwitchButton;
