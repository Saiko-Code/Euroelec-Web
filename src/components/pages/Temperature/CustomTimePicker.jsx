const CustomTimePicker = ({ value, onChange }) => {
  const handleChange = (e) => {
    const newTime = e.target.value;
    if (onChange) {
      onChange(newTime);
    }
  };

  return (
    <div className="custom-time-picker">
      <input
        type="time"
        value={value || ""}
        onChange={handleChange}
        className="time-input"
      />
    </div>
  );
};

export default CustomTimePicker;
