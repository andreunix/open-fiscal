#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$PROJECT_DIR/tmp/nfe"
MANIFEST="$OUT_DIR/index.tsv"

BASE_URL="https://www.nfe.fazenda.gov.br/portal"
COOKIE="AspxAutoDetectCookieSupport=1"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Formato: "categoria|tipoConteudo[|marcador_de_corte]"
# O marcador de corte remove tudo a partir dele (descarta versões em desuso/homologação)
#
# Página de referência: /portal/listaSubMenu.aspx?Id=04BIflQt1aY=
#   Manuais          → tipoConteudo=ndIjl+iEFdE=   (sem seção de desuso — todos vigentes)
#   Esquemas XML     → tipoConteudo=BMPFMBoln3w=   corta em "VERSÕES PARA TESTES"
#   Notas Técnicas   → tipoConteudo=04BIflQt1aY=   corta em "Documentos não vigentes"
#   Informes Técnicos→ tipoConteudo=hXzemuyNHW4=   corta em "Documentos não vigentes"
#   Diversos         → tipoConteudo=/NJarYc9nus=   corta em "Vigência expirada"
CATEGORIES=(
  "manuais|ndIjl+iEFdE="
  "esquemas-xml|BMPFMBoln3w=|VERSÕES PARA TESTES"
  "notas-tecnicas|04BIflQt1aY=|Documentos não vigentes"
  "informes-tecnicos|hXzemuyNHW4=|Documentos não vigentes"
  "diversos|/NJarYc9nus=|Vigência expirada"
)

# ── helpers ──────────────────────────────────────────────────────────────────

sanitize_filename() {
  local v="$1"
  v="${v//$'\r'/}"
  v="${v//$'\n'/}"
  v="${v//$'\302\240'/ }"
  v="${v//$'\240'/ }"
  v="${v//\//-}"
  v="${v//:/ -}"
  printf '%s' "$v" | LC_ALL=C sed -E 's/[[:space:]]+/ /g; s/^ +//; s/ +$//'
}

filename_extension() {
  local v="$1"
  local ext

  v="${v//$'\r'/}"
  v="${v%%\?*}"
  v="${v##*/}"

  if [[ "$v" == *.* ]]; then
    ext=".${v##*.}"
    if [[ "$ext" =~ ^\.[[:alnum:]]{1,8}$ ]]; then
      printf '%s' "$ext"
    fi
  fi
}

content_type_to_ext() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    application/pdf)       printf '.pdf' ;;
    application/zip)       printf '.zip' ;;
    application/xml|text/xml) printf '.xml' ;;
    application/vnd.ms-excel) printf '.xls' ;;
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet) printf '.xlsx' ;;
    application/msword)    printf '.doc' ;;
    application/vnd.openxmlformats-officedocument.wordprocessingml.document) printf '.docx' ;;
    *) printf '' ;;
  esac
}

# ── histórico ─────────────────────────────────────────────────────────────────

already_downloaded() {
  grep -qF "$1" "$MANIFEST" 2>/dev/null
}

manifest_filename_for_url() {
  local url="$1"

  awk -F'\t' -v url="$url" '$4 == url && $2 != "" && $3 != "FAIL" { filename = $2 } END { if (filename != "") print filename }' "$MANIFEST" 2>/dev/null
}

record() {
  printf '%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" >> "$MANIFEST"
}

# ── extração de links ─────────────────────────────────────────────────────────

extract_links() {
  perl -0ne '
    while (/<a[^>]+target="_blank"[^>]+href="([^"]*exibirArquivo\.aspx\?conteudo=[^"]+)"[^>]*>\s*<span class="tituloConteudo">([\s\S]*?)<\/span>/gsi) {
      my ($href, $title) = ($1, $2);
      $href  =~ s/&#xD;|&#xA;|\r|\n//g;   # remove quebras de linha do HTML
      $href  =~ s/^\s+|\s+$//g;            # trim leading/trailing
      $href  =~ s/ /%20/g;                 # espaços internos no conteudo= viram %20
      $href  =~ s/&amp;/&/g;
      $title =~ s/<[^>]+>/ /g;
      $title =~ s/&#xD;|&#xA;|\r|\n/ /g;
      $title =~ s/&nbsp;/ /g;
      $title =~ s/\xC2\xA0/ /g;
      $title =~ s/\xA0/ /g;
      $title =~ s/\x{a0}/ /g;
      $title =~ s/\x{fffd}/ /g;
      $title =~ s/&[gl]t;|&amp;//g;
      $title =~ s/\s+/ /g;
      $title =~ s/^ +| +$//g;
      print "$href\t$title\n";
    }
  '
}

fetch_links() {
  local content_id="$1"
  local stop_marker="${2:-}"
  local html

  if ! html="$(curl -fsSL -A "$USER_AGENT" --cookie "$COOKIE" \
    "${BASE_URL}/listaConteudo.aspx?tipoConteudo=${content_id}")"; then
    printf '  FAIL (lista indisponível)  %s\n' "$content_id" >&2
    return 0
  fi

  if [[ -n "$stop_marker" ]]; then
    html="$(printf '%s' "$html" | perl -0pe "s/\Q${stop_marker}\E.*//si")"
  fi

  printf '%s' "$html" | extract_links | LC_ALL=C sort -u
}

# ── resolução de nome de arquivo ──────────────────────────────────────────────

resolve_filename() {
  local url="$1"
  local title="$2"
  local prefer_title="${3:-0}"
  local headers content_type location filename ext

  # GET com -D para capturar headers — servidor ASP.NET não responde HEAD corretamente
  if ! headers="$(curl -fsSL -A "$USER_AGENT" --cookie "$COOKIE" -o /dev/null -D - "$url")"; then
    return 1
  fi
  content_type="$(printf '%s\n' "$headers" | sed -nE 's/^Content-Type: ([^;[:space:]]+).*/\1/ip' | tail -n 1)"
  location="$(printf '%s\n' "$headers" | sed -nE 's/^Location: (.*)/\1/ip' | tail -n 1)"
  filename="$(printf '%s\n' "$headers" | sed -nE 's/.*[Ff]ilename="?([^";]+)"?.*/\1/p' | tail -n 1)"

  if [[ "$location" == */principal.aspx* ]] || \
     [[ "$(printf '%s' "$content_type" | tr '[:upper:]' '[:lower:]')" == text/html ]]; then
    return 1
  fi

  if [[ "$prefer_title" == "1" ]]; then
    ext="$(filename_extension "$filename")"
    [[ -n "$ext" ]] || ext="$(content_type_to_ext "$content_type")"
    filename="$(sanitize_filename "${title}${ext}")"
    [[ -n "$filename" ]] || return 1
    printf '%s' "$filename"
    return 0
  fi

  if [[ -n "$filename" ]]; then
    filename="$(sanitize_filename "$filename")"
    [[ -n "$filename" ]] || return 1
    printf '%s' "$filename"
    return 0
  fi

  ext="$(content_type_to_ext "$content_type")"
  filename="$(sanitize_filename "${title}${ext}")"
  [[ -n "$filename" ]] || return 1
  printf '%s' "$filename"
}

# ── download ──────────────────────────────────────────────────────────────────

download_file() {
  local category="$1"
  local url="$2"
  local title="$3"
  local category_dir="$OUT_DIR/$category"
  local filename target temp mime prefer_title manifest_filename

  mkdir -p "$category_dir"

  manifest_filename="$(manifest_filename_for_url "$url")"
  if [[ -n "$manifest_filename" ]]; then
    target="$category_dir/$manifest_filename"
    if [[ -f "$target" && -s "$target" ]]; then
      mime="$(file -b --mime-type "$target")"
      if [[ "$mime" != "text/html" ]]; then
        printf '  SKIP (histórico)  %s\n' "$manifest_filename" >&2
        return 0
      fi
    fi
  fi

  prefer_title=0
  [[ "$category" == "notas-tecnicas" ]] && prefer_title=1

  if ! filename="$(resolve_filename "$url" "$title" "$prefer_title")"; then
    printf '  FAIL (link inválido)  %s\n' "$title" >&2
    record "$category" "$(sanitize_filename "$title")" "FAIL" "$url"
    return 0
  fi

  if [[ -z "$filename" ]]; then
    printf '  FAIL (nome vazio)  %s\n' "$title" >&2
    record "$category" "$(sanitize_filename "$title")" "FAIL" "$url"
    return 0
  fi

  target="$category_dir/$filename"

  if already_downloaded "$url" && [[ -f "$target" && -s "$target" ]]; then
    mime="$(file -b --mime-type "$target")"
    if [[ "$mime" != "text/html" ]]; then
      printf '  SKIP (histórico)  %s\n' "$filename" >&2
      return 0
    fi
  fi

  if [[ -f "$target" && -s "$target" ]]; then
    mime="$(file -b --mime-type "$target")"
    if [[ "$mime" != "text/html" ]]; then
      printf '  SKIP (arquivo existe)  %s\n' "$filename" >&2
      record "$category" "$filename" "SKIP" "$url"
      return 0
    fi
    rm -f "$target"
  fi

  temp="${target}.part"
  rm -f "$temp"
  if ! curl -fsSL -A "$USER_AGENT" --cookie "$COOKIE" -o "$temp" "$url"; then
    rm -f "$temp"
    printf '  FAIL (download)  %s\n' "$filename" >&2
    record "$category" "$filename" "FAIL" "$url"
    return 0
  fi

  mime="$(file -b --mime-type "$temp")"
  if [[ "$mime" == "text/html" ]]; then
    rm -f "$temp"
    printf '  FAIL (resposta HTML)  %s\n' "$filename" >&2
    record "$category" "$filename" "FAIL" "$url"
    return 0
  fi

  mv "$temp" "$target"
  printf '  OK  %s\n' "$filename" >&2
  record "$category" "$filename" "OK" "$url"
}

# ── main ──────────────────────────────────────────────────────────────────────

run_all() {
  for spec in "${CATEGORIES[@]}"; do
    local category="${spec%%|*}"
    local rest="${spec#*|}"
    local content_id="${rest%%|*}"
    local stop_marker=""
    [[ "$rest" == *"|"* ]] && stop_marker="${rest#*|}"

    printf '\n[%s]\n' "$category" >&2
    [[ -n "$stop_marker" ]] && printf '  (filtrando após: "%s")\n' "$stop_marker" >&2

    while IFS=$'\t' read -r href title; do
      [[ -n "$href" ]] || continue
      download_file "$category" "${BASE_URL}/${href#./}" "$title"
    done < <(fetch_links "$content_id" "$stop_marker")
  done
}

retry_fails() {
  local tmp fails_file
  tmp="$(mktemp)"
  fails_file="$(mktemp)"

  # separa as linhas FAIL em arquivo temporário e mantém o resto
  awk -F'\t' '$3 != "FAIL"' "$MANIFEST" > "$tmp"
  awk -F'\t' '$3 == "FAIL" { print $1 "\034" $2 "\034" $4 }' "$MANIFEST" > "$fails_file"

  local count
  count="$(grep -c . "$fails_file" || true)"
  printf '\n%s entradas FAIL encontradas\n' "$count" >&2

  if [[ "$count" -eq 0 ]]; then
    rm "$tmp"
    rm "$fails_file"
    return 0
  fi

  # substitui o manifesto sem as linhas FAIL
  mv "$tmp" "$MANIFEST"

  while IFS=$'\034' read -r category filename url; do
    [[ -n "$url" ]] || continue
    printf '\n[%s] %s\n' "$category" "$filename" >&2
    download_file "$category" "$url" "$filename"
  done < "$fails_file"

  rm "$fails_file"
}

main() {
  mkdir -p "$OUT_DIR"

  if [[ ! -f "$MANIFEST" ]]; then
    printf 'category\tfilename\tstatus\turl\n' > "$MANIFEST"
  fi

  if [[ "${1:-}" == "--retry-fails" ]]; then
    retry_fails
  else
    run_all
  fi

  printf '\nConcluído → %s\n' "$MANIFEST" >&2
}

main "$@"
