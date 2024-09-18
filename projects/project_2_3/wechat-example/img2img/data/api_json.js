let prompt_json = {
  "3": {
    "inputs": {
      "seed": 750425633602940,
      "steps": 11,
      "cfg": 6,
      "sampler_name": "euler_ancestral",
      "scheduler": "normal",
      "denoise": 0.8,
      "model": [
        "4",
        0
      ],
      "positive": [
        "33",
        0
      ],
      "negative": [
        "33",
        1
      ],
      "latent_image": [
        "12",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "4": {
    "inputs": {
      "ckpt_name": "dreamshaperXL_turboDpmppSDE.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Load Checkpoint"
    }
  },
  "6": {
    "inputs": {
      "text": [
        "10",
        0
      ],
      "speak_and_recognation": true,
      "clip": [
        "4",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "7": {
    "inputs": {
      "text": [
        "10",
        1
      ],
      "speak_and_recognation": true,
      "clip": [
        "4",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "8": {
    "inputs": {
      "samples": [
        "3",
        0
      ],
      "vae": [
        "4",
        2
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "9": {
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": [
        "8",
        0
      ]
    },
    "class_type": "SaveImage",
    "_meta": {
      "title": "Save Image"
    }
  },
  "10": {
    "inputs": {
      "text_positive": [
        "24",
        0
      ],
      "text_negative": "",
      "style": "sai-craft clay",
      "log_prompt": "Yes",
      "style_positive": "true",
      "style_negative": true,
      "speak_and_recognation": true
    },
    "class_type": "SDXLPromptStyler",
    "_meta": {
      "title": "SDXL Prompt Styler"
    }
  },
  "11": {
    "inputs": {
      "image": "DALL·E 2024-09-11 14.58.01 - A child-like illustration of a crow flying in the air, with simple and playful shapes. The crow has black feathers, a round body, large eyes, and flap.webp",
      "upload": "image"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "Load Image"
    }
  },
  "12": {
    "inputs": {
      "pixels": [
        "25",
        0
      ],
      "vae": [
        "4",
        2
      ]
    },
    "class_type": "VAEEncode",
    "_meta": {
      "title": "VAE Encode"
    }
  },
  "20": {
    "inputs": {
      "control_net_name": "CN-anytest_v4-marged.safetensors"
    },
    "class_type": "ControlNetLoader",
    "_meta": {
      "title": "Load ControlNet Model"
    }
  },
  "24": {
    "inputs": {
      "model": "wd-v1-4-convnext-tagger-v2",
      "threshold": 0.35,
      "character_threshold": 0.85,
      "replace_underscore": false,
      "trailing_comma": false,
      "exclude_tags": "",
      "tags": "solo, simple_background, closed_mouth, full_body, artist_name, black_eyes, no_humans, bird, animal, pink_background, flying, animal_focus, beak",
      "image": [
        "11",
        0
      ]
    },
    "class_type": "WD14Tagger|pysssss",
    "_meta": {
      "title": "WD14 Tagger 🐍"
    }
  },
  "25": {
    "inputs": {
      "upscale_method": "nearest-exact",
      "width": 1024,
      "height": 1024,
      "crop": "center",
      "image": [
        "11",
        0
      ]
    },
    "class_type": "ImageScale",
    "_meta": {
      "title": "Upscale Image"
    }
  },
  "27": {
    "inputs": {
      "images": [
        "25",
        0
      ]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "Preview Image"
    }
  },
  "33": {
    "inputs": {
      "strength": 1,
      "start_percent": 0,
      "end_percent": 1,
      "positive": [
        "6",
        0
      ],
      "negative": [
        "7",
        0
      ],
      "control_net": [
        "20",
        0
      ],
      "image": [
        "25",
        0
      ]
    },
    "class_type": "ACN_AdvancedControlNetApply",
    "_meta": {
      "title": "Apply Advanced ControlNet 🛂🅐🅒🅝"
    }
  }
} // 替换为从 Save(API Format)下载下来的JSON对象
module.exports = prompt_json;
