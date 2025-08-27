#!/usr/bin/env python3
"""
Script para comparar esquemas de bases de datos PostgreSQL
"""

def parse_schema_file(filename):
    """Parse schema file and return structured data"""
    schema = {}
    with open(filename, 'r') as f:
        lines = f.readlines()
        
        # Skip header lines
        for i, line in enumerate(lines):
            if '---' in line:
                start_idx = i + 1
                break
        
        for line in lines[start_idx:]:
            line = line.strip()
            if not line or line.startswith('('):
                continue
                
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 7:
                table = parts[0]
                column = parts[1]
                data_type = parts[2]
                max_length = parts[3] if parts[3] else None
                default = parts[4] if parts[4] else None
                nullable = parts[5]
                position = parts[6]
                
                if table not in schema:
                    schema[table] = {}
                
                schema[table][column] = {
                    'type': data_type,
                    'max_length': max_length,
                    'default': default,
                    'nullable': nullable,
                    'position': position
                }
    
    return schema

def compare_schemas(local_schema, supabase_schema):
    """Compare two schemas and return differences"""
    differences = {
        'missing_in_supabase': {},
        'missing_in_local': {},
        'type_differences': {},
        'default_differences': {},
        'nullable_differences': {}
    }
    
    # Tables in local but not in Supabase
    for table in local_schema:
        if table not in supabase_schema:
            differences['missing_in_supabase'][table] = 'entire table'
        else:
            # Compare columns
            for column in local_schema[table]:
                if column not in supabase_schema[table]:
                    if table not in differences['missing_in_supabase']:
                        differences['missing_in_supabase'][table] = []
                    differences['missing_in_supabase'][table].append(column)
                else:
                    # Compare properties
                    local_col = local_schema[table][column]
                    supa_col = supabase_schema[table][column]
                    
                    if local_col['type'] != supa_col['type']:
                        if table not in differences['type_differences']:
                            differences['type_differences'][table] = {}
                        differences['type_differences'][table][column] = {
                            'local': local_col['type'],
                            'supabase': supa_col['type']
                        }
                    
                    if local_col['nullable'] != supa_col['nullable']:
                        if table not in differences['nullable_differences']:
                            differences['nullable_differences'][table] = {}
                        differences['nullable_differences'][table][column] = {
                            'local': local_col['nullable'],
                            'supabase': supa_col['nullable']
                        }
    
    # Tables in Supabase but not in local
    for table in supabase_schema:
        if table not in local_schema:
            differences['missing_in_local'][table] = 'entire table'
        else:
            for column in supabase_schema[table]:
                if column not in local_schema[table]:
                    if table not in differences['missing_in_local']:
                        differences['missing_in_local'][table] = []
                    differences['missing_in_local'][table].append(column)
    
    return differences

def generate_report(differences):
    """Generate markdown report of differences"""
    report = []
    report.append("\n## DIFERENCIAS ENCONTRADAS\n")
    
    if differences['missing_in_supabase']:
        report.append("\n### ❌ Tablas/Columnas que faltan en SUPABASE:\n")
        for table, items in differences['missing_in_supabase'].items():
            if items == 'entire table':
                report.append(f"- **{table}**: TABLA COMPLETA FALTA")
            else:
                report.append(f"- **{table}**:")
                for col in items:
                    report.append(f"  - {col}")
    
    if differences['missing_in_local']:
        report.append("\n### ⚠️ Tablas/Columnas en Supabase pero NO en local:\n")
        for table, items in differences['missing_in_local'].items():
            if items == 'entire table':
                report.append(f"- **{table}**: TABLA SOLO EN SUPABASE")
            else:
                report.append(f"- **{table}**:")
                for col in items:
                    report.append(f"  - {col}")
    
    if differences['type_differences']:
        report.append("\n### 🔄 Diferencias de TIPO DE DATO:\n")
        for table, columns in differences['type_differences'].items():
            report.append(f"- **{table}**:")
            for col, types in columns.items():
                report.append(f"  - {col}: local={types['local']} vs supabase={types['supabase']}")
    
    if differences['nullable_differences']:
        report.append("\n### 📝 Diferencias de NULL/NOT NULL:\n")
        for table, columns in differences['nullable_differences'].items():
            report.append(f"- **{table}**:")
            for col, nulls in columns.items():
                report.append(f"  - {col}: local={nulls['local']} vs supabase={nulls['supabase']}")
    
    # Count summary
    total_issues = (
        len(differences['missing_in_supabase']) +
        len(differences['missing_in_local']) +
        len(differences['type_differences']) +
        len(differences['nullable_differences'])
    )
    
    if total_issues == 0:
        report.append("\n✅ **NO HAY DIFERENCIAS - Los esquemas son idénticos**\n")
    else:
        report.append(f"\n📊 **TOTAL DE PROBLEMAS: {total_issues}**\n")
    
    return '\n'.join(report)

def main():
    print("Analizando esquemas...")
    
    # Parse both schemas
    local_schema = parse_schema_file('local_schema_detail.txt')
    supabase_schema = parse_schema_file('supabase_schema_detail.txt')
    
    print(f"Tablas en local: {len(local_schema)}")
    print(f"Tablas en Supabase: {len(supabase_schema)}")
    
    # Compare schemas
    differences = compare_schemas(local_schema, supabase_schema)
    
    # Generate report
    report = generate_report(differences)
    
    # Save report
    with open('COMPARACION_BD.md', 'a') as f:
        f.write(report)
    
    print(report)
    
    # Generate SQL fixes if needed
    if differences['missing_in_supabase']:
        print("\n\nGenerando SQL para corregir Supabase...")
        with open('fix_missing_columns.sql', 'w') as f:
            f.write("-- SQL para agregar columnas faltantes en Supabase\n\n")
            for table, items in differences['missing_in_supabase'].items():
                if items != 'entire table' and isinstance(items, list):
                    for col in items:
                        # Get column details from local schema
                        col_info = local_schema[table][col]
                        f.write(f"ALTER TABLE public.\"{table}\" ADD COLUMN IF NOT EXISTS \"{col}\" {col_info['type']}")
                        if col_info['max_length']:
                            f.write(f"({col_info['max_length']})")
                        if col_info['default']:
                            f.write(f" DEFAULT {col_info['default']}")
                        if col_info['nullable'] == 'NO':
                            f.write(" NOT NULL")
                        f.write(";\n")

if __name__ == "__main__":
    main()