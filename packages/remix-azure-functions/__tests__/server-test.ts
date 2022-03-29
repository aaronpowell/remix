import { Context, HttpRequest } from "@azure/functions";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";
import { Response } from "@remix-run/node";

import {
  createRemixHeaders,
  createRemixRequest,
  createRequestHandler,
} from "../server";

// We don't want to test that the remix server works here (that's what the
// puppetteer tests do), we just want to test the azure adapter
jest.mock("@remix-run/server-runtime");
let mockedCreateRequestHandler =
  createRemixRequestHandler as jest.MockedFunction<
    typeof createRemixRequestHandler
  >;

describe("azure createRequestHandler", () => {
  let context: Context;

  beforeEach(() => {
    context = { log: jest.fn() } as unknown as Context;
  });

  describe("basic requests", () => {
    afterEach(() => {
      mockedCreateRequestHandler.mockReset();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it("handles requests", async () => {
      mockedCreateRequestHandler.mockImplementation(() => async (req) => {
        return new Response(`URL: ${new URL(req.url).pathname}`);
      });

      let mockedRequest: HttpRequest = {
        method: "GET",
        url: "/foo/bar",
        rawBody: "",
        headers: {
          "x-ms-original-url": "http://localhost:3000/foo/bar",
        },
        params: {},
        query: {},
        body: "",
      };

      const res = await createRequestHandler({ build: undefined })(
        context,
        mockedRequest
      );

      expect(res.status).toBe(200);
      expect(res.body).toBe("URL: /foo/bar");
    });

    it.todo("handles status codes");

    it.todo("sets headers");
  });
});

describe("azure createRemixHeaders", () => {
  describe("creates fetch headers from azure headers", () => {
    it("handles empty headers", () => {
      expect(createRemixHeaders({})).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {},
        }
      `);
    });

    it("handles simple headers", () => {
      expect(createRemixHeaders({ "x-foo": "bar" })).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-foo": Array [
              "bar",
            ],
          },
        }
      `);
    });

    it("handles multiple headers", () => {
      expect(createRemixHeaders({ "x-foo": "bar", "x-bar": "baz" }))
        .toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-bar": Array [
              "baz",
            ],
            "x-foo": Array [
              "bar",
            ],
          },
        }
      `);
    });

    it("handles headers with multiple values", () => {
      expect(createRemixHeaders({ "x-foo": "bar, baz" }))
        .toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-foo": Array [
              "bar, baz",
            ],
          },
        }
      `);
    });

    it("handles headers with multiple values and multiple headers", () => {
      expect(createRemixHeaders({ "x-foo": "bar, baz", "x-bar": "baz" }))
        .toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "x-bar": Array [
              "baz",
            ],
            "x-foo": Array [
              "bar, baz",
            ],
          },
        }
      `);
    });
  });
});

describe("azure createRemixRequest", () => {
  it("creates a request with the correct headers", async () => {
    let request: HttpRequest = {
      method: "GET",
      url: "/foo/bar",
      rawBody: "",
      headers: {
        "x-ms-original-url": "http://localhost:3000/foo/bar",
      },
      params: {},
      query: {},
      body: "",
    };

    expect(createRemixRequest(request)).toMatchInlineSnapshot(`
      Request {
        "agent": undefined,
        "compress": true,
        "counter": 0,
        "follow": 20,
        "size": 0,
        "timeout": 0,
        Symbol(Body internals): Object {
          "body": null,
          "disturbed": false,
          "error": null,
        },
        Symbol(Request internals): Object {
          "headers": Headers {
            Symbol(map): Object {
              "x-ms-original-url": Array [
                "http://localhost:3000/foo/bar",
              ],
            },
          },
          "method": "GET",
          "parsedURL": Url {
            "auth": null,
            "hash": null,
            "host": "localhost:3000",
            "hostname": "localhost",
            "href": "http://localhost:3000/foo/bar",
            "path": "/foo/bar",
            "pathname": "/foo/bar",
            "port": "3000",
            "protocol": "http:",
            "query": null,
            "search": null,
            "slashes": true,
          },
          "redirect": "follow",
          "signal": null,
        },
      }
    `);
  });
});