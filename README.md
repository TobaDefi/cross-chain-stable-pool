# {proj-name}-{component}-{function}

## naming conventions
* naming should be aligned with https://www.notion.so/Naming-conventions-11e24074d7a180299047cd0f9bfdae78

## endpoints styleguie
* https://www.notion.so/Endpoints-12324074d7a180b4bfc8ffe4f9946a21
* https://www.notion.so/Success-Response-11e24074d7a180c69ad5ee4b04b52242
* https://www.notion.so/Error-Response-Error-Handling-11e24074d7a180e1b49bda4d4834346f

## documentation
### Data Model
* https://dbdiagram.io/d

### OpenAPI documentation
* https://docs.nestjs.com/openapi/introduction

```
{{host}}/api
```

### Hoppscotch
* [postman-like documentation](https://lumoscodes.hoppscotch.io/)

## build
```sh
npm i
npm run build
```
## configure
[example config](./.env.example)

## run
```sh
npm run dev
```

## maintain
### liveness check
```
GET {{host}}/api/health

content-type: application/json

{
  "status": "ok",
  "version": "v0.9.1-6e8d8ad",
  "updatedAt": 1728833343
}
```

### monitoring
* ensure porject is connected to [sentry](https://lumoscodes-ltd.sentry.io/projects/)
* ensure porject logs every action
