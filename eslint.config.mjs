import tseslint from 'typescript-eslint';
export default tseslint.config({ ignores: ['**/node_modules/**', '**/.next/**', '**/out/**', '**/cache/**', '**/lib/forge-std/**', '**/next-env.d.ts', '**/abi/**', '**/.tools/**', '**/test-results/**'] }, ...tseslint.configs.recommended);
