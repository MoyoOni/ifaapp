import { InputSanitizationMiddleware } from './input-sanitization.middleware';

describe('InputSanitizationMiddleware', () => {
  let middleware: InputSanitizationMiddleware;

  beforeEach(() => {
    middleware = new InputSanitizationMiddleware();
  });

  function makeReqRes(body: any, query: any, params: any) {
    // Mirrors Express's real req.query/req.params: getter-only accessors that
    // can only be mutated in place, not reassigned. main.ts registers this
    // middleware as `middleware.use.bind(middleware)` -- these tests call it
    // the same way, since calling it unbound (as a bare function reference)
    // is exactly the bug this file guards against (P3-10).
    const queryStore = { ...query };
    const paramsStore = { ...params };
    const req: any = { body };
    Object.defineProperty(req, 'query', { get: () => queryStore, enumerable: true });
    Object.defineProperty(req, 'params', { get: () => paramsStore, enumerable: true });
    const res: any = {};
    const next = jest.fn();
    return { req, res, next };
  }

  it('does not throw when called as a bound function (matches main.ts registration)', () => {
    const { req, res, next } = makeReqRes({ name: 'ok' }, {}, {});
    const bound = middleware.use.bind(middleware);
    expect(() => bound(req, res, next)).not.toThrow();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws if called as an unbound function reference (the regression this guards against)', () => {
    const { req, res, next } = makeReqRes({}, {}, {});
    const unbound = middleware.use;
    expect(() => unbound(req, res, next)).toThrow();
  });

  it('escapes HTML in req.body strings', () => {
    const { req, res, next } = makeReqRes({ comment: '<script>alert(1)</script>' }, {}, {});
    middleware.use(req, res, next);
    expect(req.body.comment).not.toContain('<script>');
    expect(next).toHaveBeenCalled();
  });

  it('sanitizes req.query in place without reassigning the property', () => {
    const { req, res, next } = makeReqRes({}, { search: '<b>bold</b>' }, {});
    middleware.use(req, res, next);
    expect(req.query.search).not.toContain('<b>');
    expect(next).toHaveBeenCalled();
  });

  it('sanitizes req.params in place without reassigning the property', () => {
    const { req, res, next } = makeReqRes({}, {}, { id: '"><img src=x>' });
    middleware.use(req, res, next);
    expect(req.params.id).not.toContain('<img');
    expect(next).toHaveBeenCalled();
  });

  it('recursively sanitizes nested objects in the body', () => {
    const { req, res, next } = makeReqRes(
      { user: { bio: '<i>italic</i>', tags: ['<u>x</u>'] } },
      {},
      {}
    );
    middleware.use(req, res, next);
    expect(req.body.user.bio).not.toContain('<i>');
    expect(req.body.user.tags[0]).not.toContain('<u>');
    expect(next).toHaveBeenCalled();
  });

  it('passes through non-string values unchanged', () => {
    const { req, res, next } = makeReqRes({ count: 5, active: true, meta: null }, {}, {});
    middleware.use(req, res, next);
    expect(req.body.count).toBe(5);
    expect(req.body.active).toBe(true);
    expect(req.body.meta).toBe(null);
    expect(next).toHaveBeenCalled();
  });
});
