import { useState } from "react";

const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return { notification, setNotification: showNotification };
};

export default useNotification;
