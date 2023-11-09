import { useState, useEffect } from "react";
import axios from "axios";

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading("loading...");
    setData(null);
    setError(null);
    axios
      .get(url)
      .then((res) => {
        setLoading(false);
        //checking for multiple responses for more flexibility
        //with the url we send in.
        console.log(res.data);
        res.data.data && setData(res.data.data);
        // res.content && setData(res.content);
      })
      .catch((err) => {
        console.log("error", err);
        setLoading(false);
        setError(err);
      });
  }, [url]);

  return { data, loading, error };
}
export default useFetch;
