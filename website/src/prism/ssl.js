/**
 * Prism syntax highlighting for SSL (Star Trek Scripting Language)
 * Used in Fallout 2 modding.
 */

const sslLanguage = {
  comment: [
    {
      pattern: /\/\*[\s\S]*?\*\//,
      greedy: true,
    },
    {
      pattern: /\/\/.*/,
      greedy: true,
    },
  ],
  string: {
    pattern: /"(?:[^"\\]|\\.)*"/,
    greedy: true,
  },
  directive: {
    pattern: /#\s*(?:include|define|ifdef|ifndef|else|endif|undef)\b.*/,
    alias: 'property',
  },
  keyword: [
    {
      // Control flow
      pattern:
        /\b(?:if|then|else|while|do|begin|end|return|call|procedure|variable|for|foreach|in|break|continue)\b/,
      alias: 'keyword',
    },
    {
      // Logical operators
      pattern: /\b(?:and|or|not|bwand|bwor|bwxor|bwnot)\b/,
      alias: 'keyword',
    },
  ],
  'class-name': {
    pattern: /\b(?:int|void|float|string|boolean|ObjectPtr|any)\b/,
    alias: 'type',
  },
  builtin: {
    // Common SSL built-in functions
    pattern:
      /\b(?:self_obj|dude_obj|source_obj|target_obj|obj_pid|obj_name|obj_carrying_pid_obj|tile_contains_obj_pid|critter_stat|set_critter_stat|critter_heal|critter_dmg|critter_add_trait|critter_rm_trait|critter_state|critter_kill_type|critter_injure|critter_uninjure|has_skill|using_skill|roll_vs_skill|skill_contest|is_success|is_critical|how_much|random|roll_dice|move_to|create_object|destroy_object|tile_num|elevation|tile_distance|tile_distance_objs|cur_map_index|display_msg|debug_msg|float_msg|message_str|gsay_start|gsay_end|gsay_reply|gsay_option|gsay_message|start_gdialog|end_dialogue|play_sfx|play_gmovie|game_time|game_time_hour|game_ticks|add_timer_event|rm_timer_event|script_overrides|get_local_var|set_local_var|get_map_var|set_map_var|get_global_var|set_global_var|global_var|local_var|map_var|give_xp|add_obj_to_inven|rm_obj_from_inven|inven_ptr|item_caps_total|item_caps_adjust|wield_obj_critter|use_obj|obj_item_subtype|combat_is_initialized|attack|terminate_combat|animate_stand|animate_move_obj_to_tile|reg_anim_func|reg_anim_animate|reg_anim_animate_reverse|reg_anim_obj_move_to_obj|reg_anim_obj_run_to_obj|reg_anim_obj_move_to_tile|reg_anim_obj_run_to_tile|reg_anim_play_sfx|reg_anim_animate_forever|anim_busy|metarule|metarule3|set_light_level|obj_set_light_level|fade_in|fade_out|load_map|mark_area_known|obj_is_visible|obj_is_locked|obj_lock|obj_unlock|obj_open|obj_close|obj_on_screen|obj_art_fid|art_anim|explosion|fire_at|critter_attempt_placement|critter_add_aid|run_dialog_reaction|party_add|party_remove|party_member_count|rotation_to_tile|tile_num_in_direction|tile_in_tile_rect|obj_type|obj_item_subtype|get_proto_data|set_proto_data|get_critter_current_ap|set_critter_current_ap|weapon_anim_code|weapon_damage_type)\b/,
    alias: 'function',
  },
  constant: {
    // Common constants
    pattern:
      /\b(?:STAT_[A-Za-z_]+|SKILL_[A-Za-z_]+|PERK_[A-Za-z_]+|TRAIT_[A-Za-z_]+|PID_[A-Za-z_]+|SCRIPT_[A-Za-z_]+|OBJ_TYPE_[A-Za-z_]+|ITEM_TYPE_[A-Za-z_]+|SCENERY_TYPE_[A-Za-z_]+|DAMAGE_TYPE_[A-Za-z_]+|DMG_[A-Za-z_]+|KILL_TYPE_[A-Za-z_]+|GVAR_[A-Za-z_]+|LVAR_[A-Za-z_]+|MVAR_[A-Za-z_]+|FLOAT_MSG_[A-Za-z_]+|INVEN_TYPE_[A-Za-z_]+|GOOD|NEUTRAL|BAD|DAM_[A-Za-z_]+|TRUE|FALSE|true|false)\b/,
    alias: 'constant',
  },
  number: [
    {
      // Hexadecimal
      pattern: /\b0x[0-9a-fA-F]+\b/,
    },
    {
      // Decimal and float
      pattern: /\b\d+(?:\.\d+)?\b/,
    },
  ],
  operator: /\+|\-|\*|\/|%|:=|==|!=|<=|>=|<|>/,
  punctuation: /[{}[\];(),]/,
};

module.exports = sslLanguage;
