/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SensorApi = createApi({
  reducerPath: "sensorApi",
  baseQuery: fetchBaseQuery({ baseUrl: `https://analytics.energyops.dev/gateway` }),
  tagTypes: ["SensorData"],
  endpoints: (builder) => ({
    getSensors: builder.query<any, any>({
      query: ({ start, end }) => {
        console.log(start, end);
        return { url: `/graph`, params: { startDateTime: start, endDateTime: end } };
      },
      providesTags: ["SensorData"],
    }),
    updateSensors: builder.mutation<any, any>({
      query: ({ start, end }) => `/graph?startDateTime=${start}&endDateTime=${end}`,
      invalidatesTags: ["SensorData"],
    }),
  }),
});

export const { useGetSensorsQuery, useUpdateSensorsMutation } = SensorApi;
