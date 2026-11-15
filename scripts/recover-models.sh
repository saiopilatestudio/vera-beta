#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../www"
restore() {
    local name="$1" url="$2" digest="$3"
    if [[ -f "$name" ]] && echo "$digest  $name" | sha256sum -c -; then return; fi
    local temp
    temp="$(mktemp "./$name.partial.XXXXXXXX")"
    curl --fail --location --retry 3 "$url" --output "$temp"
    echo "$digest  $temp" | sha256sum -c -
    mv "$temp" "$name"
}
restore coach.gguf https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf 74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db
restore food.onnx https://huggingface.co/onnx-community/swin-finetuned-food101-ONNX/resolve/main/onnx/model_quantized.onnx a80994b195389eb16c6bfd65e55841e888bb09886e86dce0957e124ad44c64a8
