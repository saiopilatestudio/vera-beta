#!/bin/sh
set -eu
cd "$(dirname "$0")/../www"
download() {
  url=$1
  file=$2
  sha=$3
  if echo "$sha  $file" | sha256sum -c --status; then return; fi
  curl --fail --location --retry 3 "$url" --output "$file.partial"
  echo "$sha  $file.partial" | sha256sum --check
  mv "$file.partial" "$file"
}
download 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf' coach.gguf 74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db
download 'https://huggingface.co/onnx-community/swin-finetuned-food101-ONNX/resolve/main/onnx/model_quantized.onnx' food.onnx a80994b195389eb16c6bfd65e55841e888bb09886e86dce0957e124ad44c64a8

download 'https://huggingface.co/Xenova/clip-vit-base-patch32/resolve/main/onnx/vision_model_quantized.onnx' vision.onnx 583fd1110a514667812fee7d684952aaf82a99b959760c8d7dca7e0ab9839299
