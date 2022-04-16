import axios, { Method } from "axios";
import { HTTPMethod, MetaAPIRequest, metaRequest } from "unimocks";

export const axiosRequest = <Output, Input>(options: {
  baseURL: string;
  method: HTTPMethod | ((input: Input) => HTTPMethod);
  path: string | ((input: Input) => string);
  query?: (input: Input) => {
    [name: string]: string;
  };
  headers?: (input: Input) => {
    [name: string]: string;
  };
  body?: (input: Input) => any;
}): MetaAPIRequest<Output, Input> =>
  metaRequest(
    (config) =>
      axios
        .request({
          baseURL: options.baseURL,
          method: config.method as Method,
          url: config.path,
          params: config.query,
          headers: config.headers,
          data: config.body,
        })
        .then(({ data }) => data),
    options
  );
