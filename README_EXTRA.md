# Notas de segurança e próximos passos

- As políticas no SQL tornam as tabelas públicas para facilitar testes. Antes de colocar em produção, substitua por policies que verifiquem `auth.uid()` ou desative essas políticas e implemente uma proteção adequada.
- Para uploads privados, crie bucket privado e gere signed URLs para exibição.
- Se quiser, eu gero políticas seguras que só permitem que usuários com um token/role específico façam alterações.
